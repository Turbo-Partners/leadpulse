# LeadPulse: B2B Lead Management SaaS

LeadPulse is a micro SaaS platform for small B2B businesses to find and manage commercial leads. It provides a clean, modern interface designed for simplicity and efficiency.

## Features

- **User Authentication**: Secure login and registration
- **Dashboard**: Key metrics including lead counts, response rates, and pipeline values
- **Kanban Pipeline**: Visual management of leads through the sales process
- **Email Cadences**: Automated email sequence management
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- React DnD for drag-and-drop functionality

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/leadpulse.git
   cd leadpulse
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in your terminal (typically http://localhost:5173)

## Project Structure

- `/src/components`: Reusable UI components
- `/src/pages`: Main application pages
- `/src/contexts`: React context providers
- `/src/types`: TypeScript type definitions
- `/src/mockData`: Temporary mock data (to be replaced with API calls)

## Building for Production

To create a production build:

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

[MIT](LICENSE)