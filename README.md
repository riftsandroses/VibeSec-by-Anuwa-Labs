# VibeSec by Anuwa Labs

A professional VSCode extension for security testing and vulnerability scanning with an elegant UI built with Svelte 4.

## Features

- 🔐 Secure authentication with JWT tokens
- 📊 Insights Dashboard with security metrics
- 🔍 Automated security testing of workspace
- 📋 Detailed vulnerability analysis with tabular format
- 🛠️ One-click vulnerability fixes
- 👤 User profile with server health monitoring
- 📱 Responsive portrait-oriented design
- 🎨 Clean, modern UI inspired by Cupertino UI design language

## Project Structure

```
vibesec/
├── src/
│   └── extension.ts          # Main extension file
├── webview/
│   ├── main.js               # Webview entry point
│   ├── App.svelte            # Main app component
│   ├── stores.js             # Svelte stores
│   └── components/
│       ├── Login.svelte      # Login screen
│       ├── Dashboard.svelte  # Insights dashboard
│       ├── SecurityResults.svelte  # Results screen
│       ├── VulnerabilityTable.svelte  # Table component
│       ├── Profile.svelte    # Profile screen
│       └── Header.svelte     # Navigation header
├── resources/
│   └── icon.svg              # Extension icon
├── package.json
├── tsconfig.json
├── webpack.config.js         # Extension bundler
├── rollup.config.js          # Webview bundler
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- VSCode (v1.80 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vibesec
```

2. Install dependencies:
```bash
npm install
```

3. Install additional dependencies:
```bash
npm install --save-dev archiver @types/archiver
```

### Development

1. Build the webview (Svelte components):
```bash
npm run build:webview
```

2. Build the extension:
```bash
npm run compile
```

3. Watch mode for development:
```bash
# Terminal 1 - Watch webview changes
npm run build:webview -- --watch

# Terminal 2 - Watch extension changes
npm run watch
```

4. Press `F5` in VSCode to open Extension Development Host

### Building for Production

```bash
# Build both webview and extension
npm run build:webview
npm run package
```

## API Integration

The extension connects to the following Anuwa Labs APIs:

### 1. Login API
- **Endpoint**: `https://anuwalabs.com/api/v1/login`
- **Method**: POST
- **Body**: `{ username: string, password: string }`
- **Response**: `{ access: string, refresh: string }`

### 2. Security Testing API
- **Endpoint**: `https://anuwalabs.com/api/v1/security-testing/`
- **Method**: POST
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**: FormData with workspace zip file
- **Response**: 
```json
{
  "vulnerabilities": [
    {
      "name": "SQL Injection",
      "file": "src/database.js",
      "lines": "45-48",
      "severity": "Critical",
      "impact": "Allows unauthorized database access",
      "reachability": "Reachable",
      "description": "Detailed description...",
      "cve": "CVE-2023-12345",
      "recommendation": "Use parameterized queries",
      "codeSnippet": "const query = ...",
      "fix": "const query = db.prepare(...)"
    }
  ]
}
```

### 3. Profile API
- **Endpoint**: `https://anuwalabs.com/api/v1/profile`
- **Method**: GET
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "profilePicture": "https://...",
  "accountType": "Premium",
  "memberSince": "2023-01-15",
  "organization": "Anuwa Labs",
  "serverHealth": {
    "status": "Online",
    "uptime": "99.9%",
    "responseTime": "120"
  }
}
```

## Features Guide

### Login
- Enter credentials to authenticate
- Tokens are stored securely during session
- Support for password recovery and account creation

### Insights Dashboard
- View security metrics from previous scans
- See critical, high, medium, and low severity counts
- Track reachable vulnerabilities
- One-click security testing

### Security Testing
- Automatically zips workspace folder
- Uploads to Anuwa Labs API
- Displays comprehensive results
- Filter by severity and reachability

### Vulnerability Management
- Expandable table rows for detailed information
- View CVE details, recommendations, and code snippets
- One-click fixes for individual vulnerabilities
- Bulk fix options:
  - Fix All: Apply all suggested fixes
  - Fix High/Critical: Fix only severe issues
  - Fix Reachable: Fix reachable vulnerabilities

### Profile
- User information and account details
- Server health monitoring
- Interactive user guide
- Settings and preferences

## Customization

### Theming
The extension uses VSCode's built-in theming system. All colors adapt to the user's selected theme:

- `var(--vscode-editor-background)`
- `var(--vscode-editor-foreground)`
- `var(--vscode-button-background)`
- `var(--vscode-sideBar-background)`
- etc.

### API Endpoints
Update the API URLs in `src/extension.ts`:

```typescript
const LOGIN_API = 'https://anuwalabs.com/api/v1/login';
const SECURITY_TEST_API = 'https://anuwalabs.com/api/v1/security-testing/';
const PROFILE_API = 'https://anuwalabs.com/api/v1/profile';
```

## Publishing

1. Install vsce:
```bash
npm install -g @vscode/vsce
```

2. Package the extension:
```bash
vsce package
```

3. Publish to VSCode Marketplace:
```bash
vsce publish
```

## Troubleshooting

### Build Issues
- Ensure all dependencies are installed
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`

### Extension Not Loading
- Check VSCode version compatibility
- Review Extension Development Host console
- Verify `package.json` activation events

### API Connection Issues
- Verify API endpoints are accessible
- Check network connectivity
- Ensure proper CORS headers on API server
- Validate token format and expiration

### Webview Not Displaying
- Check browser console in Developer Tools
- Verify all Svelte components compile correctly
- Ensure CSS is properly bundled

## Security Considerations

- Tokens are stored in memory only (not localStorage)
- All API calls use HTTPS
- Sensitive data never persisted to disk
- Workspace zip is temporary and deleted after upload
- User confirmation recommended for auto-fixes

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## Development Tips

### Adding New Components

Create new Svelte component in `webview/components/`:

```svelte
<script>
  // Component logic
</script>

<!-- Template -->
<div class="my-component">
  <!-- Content -->
</div>

<style>
  /* Scoped styles */
  .my-component {
    /* Use VSCode theme variables */
    background: var(--vscode-editor-background);
  }
</style>
```

### Adding New API Endpoints

1. Update `src/extension.ts` with new handler:

```typescript
case 'newAction':
  await this.handleNewAction(data.params);
  break;
```

2. Implement handler method:

```typescript
private async handleNewAction(params: any) {
  try {
    const response = await fetch('https://api.example.com/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params.data)
    });
    
    const data = await response.json();
    
    this._view?.webview.postMessage({
      type: 'newActionSuccess',
      data: data
    });
  } catch (error) {
    this._view?.webview.postMessage({
      type: 'newActionError',
      error: error.message
    });
  }
}
```

3. Handle response in Svelte component:

```javascript
function handleMessage(event) {
  const message = event.data;
  
  switch (message.type) {
    case 'newActionSuccess':
      // Handle success
      break;
    case 'newActionError':
      // Handle error
      break;
  }
}
```

### Testing

Run extension tests:
```bash
npm test
```

Manual testing checklist:
- [ ] Login flow works correctly
- [ ] Dashboard displays data
- [ ] Security scan creates and uploads zip
- [ ] Results table displays properly
- [ ] Vulnerability fixes apply correctly
- [ ] Profile loads user data
- [ ] All navigation works
- [ ] UI is responsive in portrait mode
- [ ] Dark/light themes both work
- [ ] Error handling displays appropriately

## Known Limitations

- Extension requires active internet connection
- Workspace must be a folder (not individual files)
- Large workspaces may take time to zip
- Fix application requires write permissions
- Token refresh not yet implemented

## Future Enhancements

- [x] Session pesistence when reloading extension
- [ ] Automatic token refresh
- [ ] Scan history and comparison
- [ ] Custom scan configurations
- [ ] Export reports (PDF, CSV)
- [ ] Real-time vulnerability notifications
- [ ] Integration with CI/CD pipelines
- [ ] Collaborative vulnerability management
- [ ] Offline mode with cached data
- [ ] Advanced filtering and sorting
- [ ] Vulnerability severity customization

## Tech Stack

- **Frontend**: Svelte 4
- **Extension Host**: TypeScript
- **Build Tools**: Webpack, Rollup
- **Styling**: VSCode Theme Variables
- **APIs**: REST with JWT authentication
- **File Processing**: Node.js fs, archiver

## License

Copyright © 2025 Anuwa Labs. All rights reserved.

## Support

For issues, questions, or feature requests:
- Email: [Support E-mail Address]
- Documentation: [Documentation URL]
- GitHub Issues: [repository]/issues

## Acknowledgments

- Built with VSCode Extension API
- Icons from Heroicons
- Security testing powered by Anuwa Labs

---

**VibeSec by Anuwa Labs** - Making your code more secure, one scan at a time.
