import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  groupId: string;
  role: 'admin' | 'collaborator';
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user's session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Requesting user verified:', requestingUser.id);

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, name, groupId, role } = body;

    console.log('Creating user with data:', { email, name, groupId, role });

    // Validate required fields
    if (!email || !password || !name || !groupId || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify that the requesting user is an admin of the specified group
    const { data: groupData, error: groupError } = await supabaseClient
      .from('user_groups')
      .select('admin_user_id')
      .eq('id', groupId)
      .eq('admin_user_id', requestingUser.id)
      .single();

    if (groupError || !groupData) {
      console.error('Group verification error:', groupError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not an admin of this group' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Group verification passed');

    // Check if user already exists in auth.users
    const { data: existingUsersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      console.error('Error listing users:', listUsersError);
      return new Response(
        JSON.stringify({ error: `Failed to check existing users: ${listUsersError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find existing user by email
    const existingUser = existingUsersData.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    let userId: string;
    let userCreated = false;

    if (existingUser) {
      // User already exists in auth, use their ID
      userId = existingUser.id;
      console.log('User already exists in auth.users:', userId);
      
      // Check if they're already in this group
      const { data: existingCollaborator } = await supabaseAdmin
        .from('group_collaborators')
        .select('id')
        .eq('group_id', groupId)
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingCollaborator) {
        return new Response(
          JSON.stringify({ error: 'User is already a member of this group' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Create new user in auth.users using admin privileges
      console.log('Creating new user in auth.users with email:', email);
      
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        user_metadata: {
          name: name
        },
        email_confirm: true // Auto-confirm email so user can login immediately
      });

      if (createError || !newUserData.user) {
        console.error('Error creating user in auth.users:', createError);
        return new Response(
          JSON.stringify({ error: `Failed to create user in auth: ${createError?.message || 'Unknown error'}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      userId = newUserData.user.id;
      userCreated = true;
      console.log('New user created in auth.users with ID:', userId);

      // Create user profile in public.users table
      try {
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: email.toLowerCase(),
            name: name
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't fail the entire operation, just log the error
        } else {
          console.log('User profile created successfully');
        }
      } catch (profileErr) {
        console.error('Exception creating user profile:', profileErr);
        // Don't fail the entire operation
      }

      // Create default group for the new user
      try {
        const { error: defaultGroupError } = await supabaseAdmin
          .from('user_groups')
          .insert({
            name: 'Meu Grupo',
            description: 'Grupo padrão criado automaticamente',
            admin_user_id: userId
          });

        if (defaultGroupError) {
          console.error('Error creating default group:', defaultGroupError);
          // Don't fail the entire operation
        } else {
          console.log('Default group created for new user');
        }
      } catch (groupErr) {
        console.error('Exception creating default group:', groupErr);
        // Don't fail the entire operation
      }

      // Create trial subscription for the new user
      try {
        const { data: trialPlan } = await supabaseAdmin
          .from('subscription_plans')
          .select('id')
          .eq('type', 'trial')
          .eq('active', true)
          .single();

        if (trialPlan) {
          const { error: subscriptionError } = await supabaseAdmin
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: trialPlan.id,
              status: 'active',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });

          if (subscriptionError) {
            console.error('Error creating trial subscription:', subscriptionError);
            // Don't fail the entire operation
          } else {
            console.log('Trial subscription created for new user');
          }
        }
      } catch (subscriptionErr) {
        console.error('Exception creating trial subscription:', subscriptionErr);
        // Don't fail the entire operation
      }
    }

    // Add user to group_collaborators table using admin client
    console.log('Adding user to group_collaborators table');
    
    const { data: collaboratorData, error: collaboratorError } = await supabaseAdmin
      .from('group_collaborators')
      .insert({
        group_id: groupId,
        user_id: userId,
        email: email.toLowerCase(),
        role: role,
        status: 'active',
        invited_by: requestingUser.id,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (collaboratorError) {
      console.error('Error adding user to group:', collaboratorError);
      return new Response(
        JSON.stringify({ error: `Failed to add user to group: ${collaboratorError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User successfully added to group:', collaboratorData);

    // Verify the user exists in auth.users
    const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (verifyError || !verifyUser.user) {
      console.error('Error verifying user in auth.users:', verifyError);
      return new Response(
        JSON.stringify({ error: 'User verification failed - user may not be able to login' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User verification successful in auth.users:', verifyUser.user.email);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userId,
          email: email,
          name: name,
          created_in_auth: userCreated,
          can_login: true
        },
        collaborator: collaboratorData,
        message: userCreated 
          ? `Usuário criado com sucesso! Credenciais de login:\nE-mail: ${email}\nSenha: ${password}\n\nO usuário já pode fazer login no sistema.`
          : `Usuário existente adicionado ao grupo com sucesso!\nE-mail: ${email}\n\nO usuário já pode fazer login no sistema.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});