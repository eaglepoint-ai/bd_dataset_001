# Form Generator

A simple, standalone form builder application that allows you to create custom forms with various input types.

## Features

- **Text Fields**: Add different input types including text, email, telephone, and URL
- **Multiple Choice**: Create radio button groups for single-selection questions
- **Checkboxes**: Add checkbox groups for multi-selection questions
- **Custom Labels**: Set custom labels and placeholders for all fields
- **Required Fields**: Mark fields as required or optional
- **Local Storage**: Forms are automatically saved to your browser's local storage
- **Form Preview**: View your saved form in a clean, display-friendly format

## Getting Started

1. Open `index.html` in your web browser
2. Click "Build a Form" to start creating your form
3. Use the form builder interface to add fields:
   - **Description**: Set the title and description for your form
   - **Text Field**: Add text input fields with various types
   - **Choice Field**: Add multiple choice or checkbox questions
4. Click "Apply" after configuring each field
5. Your form is automatically saved to local storage
6. Click "View Saved Form" to see your completed form

## File Structure

```
meteyik/
├── index.html                          # Entry point/landing page
├── Meteyik-Project/
│   └── Meteyik Survey/
│       └── Resources/
│           ├── css/
│           │   ├── formlook.css       # Styles for form builder
│           │   └── formdisplay.css    # Styles for form display
│           ├── html/
│           │   ├── form.html          # Form builder page
│           │   └── formdisplay.html   # Form display page
│           ├── images/
│           │   └── buildpic.jpg       # Background image
│           └── js/
│               ├── formgenerator.js   # Form builder logic
│               └── formdisplay.js     # Form display logic
```

## Usage

### Building a Form

1. Navigate to the form builder page
2. Add a description (title and description text)
3. Add fields:
   - Select field type (text, choice)
   - Configure field properties (label, placeholder, required, etc.)
   - Click "Apply" to add the field to your form
4. Repeat for all desired fields
5. Form is automatically saved

### Viewing Your Form

1. Navigate to the form display page
2. Your saved form will automatically load from local storage
3. The form is displayed in a clean, user-friendly format

## Technical Details

- **No Backend Required**: Everything runs in the browser
- **Pure JavaScript**: No frameworks or dependencies
- **Local Storage**: Forms persist between browser sessions
- **Responsive Design**: Works on desktop and mobile devices

## Browser Compatibility

Works in all modern browsers that support:
- Local Storage API
- ES5+ JavaScript
- CSS3

## Notes

- Forms are stored in your browser's local storage
- Clearing browser data will delete saved forms
- Each form overwrites the previous one (single form storage)

## Cleanup

This project has been cleaned up to contain only the essential form generator functionality:
- Removed all PHP backend code
- Removed authentication/login system
- Removed database integration
- Removed unnecessary pages (contact, FAQ, pricing)
- Simplified navigation
- Removed unused assets and styles
