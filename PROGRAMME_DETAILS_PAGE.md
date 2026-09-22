# 📋 Programme Details Page

## Overview
A comprehensive programme detail page that displays complete information about a specific programme and its registrations. Accessible by clicking on programme names throughout the application.

## Features

### 🎯 Programme Information Display
- **Basic Details**: Code, name, category, section, position type
- **Requirements**: Required participants, maximum participants
- **Status**: Active, inactive, or completed
- **Visual Indicators**: Color-coded badges for categories and sections

### 📊 Registration Management
- **Registration Statistics**: Total, confirmed, pending, withdrawn
- **Team Registrations**: Complete list of registered teams
- **Participant Details**: Individual participant information
- **Registration Status**: Visual status indicators

### 🔄 Tabbed Interface
- **Details Tab**: Programme information and statistics
- **Registrations Tab**: Complete registration overview

## Page Structure

### Header Section
- **Navigation**: Back button and breadcrumb
- **Programme Title**: Name and code
- **Status Badges**: Category and section indicators

### Tab Navigation
- **Programme Details**: Basic information and statistics
- **Registrations**: Team registrations and participants

### Content Sections

#### Details Tab
1. **Basic Information Card**
   - Programme code and name
   - Category with icon (🎨 Arts, ⚽ Sports, 📋 General)
   - Section (Senior, Junior, Sub-Junior, General)
   - Position type (Individual, Group, General)
   - Participant requirements
   - Current status

2. **Registration Statistics Card**
   - Total registrations count
   - Confirmed registrations
   - Pending registrations
   - Withdrawn registrations

#### Registrations Tab
1. **Registration Overview**
   - Summary statistics
   - Team participation metrics

2. **Detailed Registration List**
   - Team information with colors
   - Participant details
   - Registration status
   - Registration dates

## URL Structure
```
/programme/[id]
```
- `[id]`: MongoDB ObjectId of the programme

## API Endpoints Used

### Programme Data
```typescript
GET /api/programmes?id={programmeId}
```

### Registration Data
```typescript
GET /api/programme-participants?programmeId={programmeId}
```

### Supporting Data
```typescript
GET /api/teams
GET /api/candidates
```

## Visual Design

### Color Coding
- **Arts Programmes**: Purple theme (🎨)
- **Sports Programmes**: Green theme (⚽)
- **General Programmes**: Blue theme (📋)

### Section Colors
- **Senior**: Red theme
- **Junior**: Yellow theme
- **Sub-Junior**: Pink theme
- **General**: Gray theme

### Status Indicators
- **Active**: Green with ✅
- **Completed**: Blue with 🏁
- **Inactive**: Gray with ⏸️

## Registration Status
- **Confirmed**: Green with ✅
- **Registered**: Yellow with ⏳
- **Withdrawn**: Red with ❌

## Navigation Integration

### From Admin Panel
- Admin programmes page: Click programme name → Programme details

### From Team Admin Panel
- Team programmes page: Click programme name → Programme details

### From Programme Details
- Back button: Returns to previous page
- Breadcrumb navigation: Context-aware navigation

## Error Handling

### Programme Not Found
- User-friendly error message
- Navigation back to programmes list
- Clear error indication

### Loading States
- Skeleton loading for data fetching
- Progressive loading of different sections
- Loading indicators for async operations

## Responsive Design
- **Mobile**: Single column layout, stacked cards
- **Tablet**: Two-column layout where appropriate
- **Desktop**: Full multi-column layout with optimal spacing

## Data Relationships

### Programme → Registrations
- One programme can have multiple team registrations
- Each registration contains participant details

### Teams → Participants
- Team information displayed with registrations
- Team colors and branding maintained

### Candidates → Participants
- Individual candidate details shown
- Chest numbers linked to candidate names

## Usage Examples

### Accessing Programme Details
1. **From Admin Dashboard**:
   ```
   Admin → Programmes → Click "Programme Name" → Programme Details
   ```

2. **From Team Dashboard**:
   ```
   Team Admin → Programmes → Click "Programme Name" → Programme Details
   ```

### Viewing Registration Information
1. Navigate to programme details page
2. Click "Registrations" tab
3. View complete registration breakdown
4. See individual team participants

## Implementation Details

### State Management
- Programme data loading and caching
- Tab state management
- Error state handling
- Loading state coordination

### Performance Optimizations
- Efficient data fetching with Promise.all
- Conditional rendering based on data availability
- Optimized re-renders with proper dependencies

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast color schemes
- Semantic HTML structure

## Future Enhancements

### Planned Features
- **Export Functionality**: Export registration data
- **Print View**: Printer-friendly programme details
- **Real-time Updates**: Live registration status updates
- **Advanced Filtering**: Filter registrations by status/team

### Integration Possibilities
- **Results Integration**: Link to programme results
- **Schedule Integration**: Show programme timing
- **Communication**: Direct messaging to registered teams

## Technical Notes

### Dependencies
- Next.js 15+ for routing and SSR
- TypeScript for type safety
- Tailwind CSS for styling
- MongoDB for data storage

### Performance Considerations
- Lazy loading of registration data
- Efficient database queries
- Optimized bundle size
- Fast page transitions

The programme details page provides a comprehensive view of programme information and registrations, making it easy for both administrators and team captains to understand programme participation and manage their involvement effectively.