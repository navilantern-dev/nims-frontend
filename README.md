# NIMS Frontend

A frontend application for the Naval Inventory Management System (NIMS), designed to work with a Google Apps Script backend and deployed on GitHub Pages.

## Project Overview

NIMS Frontend is a web-based interface for managing naval inventory, vessels, users, and company information. It consists of multiple HTML pages with JavaScript functionality that connects to a Google Apps Script backend.

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript hosted on GitHub Pages
- **Backend**: Google Apps Script handling data storage and API endpoints
- **Authentication**: Token-based system with session management

## Project Structure

```
nims-frontend/
├── index.html              # Landing page
├── login.html             # User authentication
├── dashboard.html         # Main dashboard
├── register_client.html   # Company registration
├── client_list.html       # Company listing
├── client_profile.html    # Company profile view
├── register_vessel.html   # Vessel registration
├── edit_vessel.html       # Vessel editing
├── view_vessel.html       # Vessel viewing
├── create_user.html       # User creation
├── edit_user.html         # User editing
├── change_password.html   # Password management
├── 404.html              # Error page
├── js/
│   ├── api.js            # API communication layer
│   ├── nav.js            # Navigation utilities
│   └── shim.google.run.js # Google Apps Script shim
└── CNAME                 # GitHub Pages domain config
```

## Setup Instructions

### Prerequisites
- GitHub repository with Pages enabled
- Google Apps Script backend deployed
- Modern web browser

### Deployment
1. **Clone/Fork Repository**
   ```bash
   git clone [repository-url]
   cd nims-frontend
   ```

2. **Configure Backend URL**
   Edit `js/api.js` and update the `GAS_BASE` constant:
   ```javascript
   const GAS_BASE = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select source branch (usually `main`)
   - Set custom domain if needed (update CNAME file)

4. **Verify Deployment**
   - Access the site at your GitHub Pages URL
   - Test login functionality
   - Verify API connectivity

## Key Features

### User Management
- **User Levels**: Super Admin, Admin, User with different access levels
- **Authentication**: Secure login with session management
- **Profile Management**: View and edit user profiles

### Company Management
- **Registration**: Register new companies with documentation
- **Profile View**: Comprehensive company information display
- **Search & Filter**: Find companies by various criteria

### Vessel Management
- **Registration**: Add new vessels with detailed specifications
- **Inventory Tracking**: Manage vessel inventory and equipment
- **Status Monitoring**: Track vessel status and documentation

### Reports & Analytics
- **Dashboard Stats**: Quick overview of system metrics
- **Export Functions**: CSV and PDF export capabilities
- **Activity Logging**: User activity and system logs

## Development Workflow

### Local Development
1. **File Structure**: Keep the existing HTML structure
2. **JavaScript Files**: Ensure `js/` folder contains required files
3. **Testing**: Test with a local HTTP server (not file:// protocol)

### Making Changes
1. **HTML Pages**: Modify individual page files as needed
2. **Styling**: CSS is embedded in HTML files
3. **JavaScript**: 
   - API calls go in `js/api.js`
   - Navigation utilities in `js/nav.js`
   - Page-specific JS is inline in HTML files

### Deployment Process
1. **Commit Changes**: Push to main branch
2. **GitHub Pages**: Automatically deploys from main branch
3. **Verification**: Test deployed version thoroughly

## Troubleshooting

### Common Issues

#### Buttons Not Working
**Symptoms**: Dashboard or page buttons don't respond to clicks
**Solution**: Ensure JavaScript files are properly included:
```html
<script src="js/api.js"></script>
<script src="js/nav.js"></script>
<script src="js/shim.google.run.js"></script>
```

#### API Connection Failures
**Symptoms**: Login fails, data doesn't load
**Causes**:
- Incorrect `GAS_BASE` URL in `js/api.js`
- Google Apps Script not deployed with "Anyone" access
- Network/CORS issues

#### Navigation Problems
**Symptoms**: Page transitions don't work
**Solution**: Check that `js/nav.js` is loaded and `goTo()` function is available

#### Authentication Issues
**Symptoms**: Redirected to login repeatedly
**Causes**:
- Invalid or expired tokens
- localStorage issues
- Backend session management problems

### Debug Steps
1. **Check Browser Console**: Look for JavaScript errors
2. **Verify Network Requests**: Check if API calls are reaching backend
3. **Test Token Storage**: Verify localStorage contains valid token
4. **Backend Logs**: Check Google Apps Script execution logs

## Security Considerations

- **Token Management**: Tokens are stored in localStorage
- **Session Timeout**: Sessions expire after inactivity
- **Input Validation**: Forms include client-side validation
- **Access Control**: Role-based access to different features

## Browser Compatibility

- **Minimum Requirements**: Modern browsers with ES6 support
- **Tested Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for mobile devices

## Recent Changes

### Button Functionality Fix (Latest)
- **Issue**: All page buttons were non-functional after GitHub Pages deployment
- **Cause**: JavaScript files (`api.js`, `nav.js`, `shim.google.run.js`) were commented out
- **Resolution**: Activated JavaScript includes across all HTML pages
- **Files Modified**: All HTML pages except `login.html`

## Contributing

1. **Fork Repository**: Create your own fork
2. **Create Branch**: Work on feature branches
3. **Test Thoroughly**: Verify changes don't break existing functionality
4. **Submit PR**: Include description of changes and testing performed

## Support

For technical issues or questions:
1. Check this README and troubleshooting section
2. Review browser console for error messages
3. Verify backend connectivity and deployment
4. Check GitHub Pages deployment status