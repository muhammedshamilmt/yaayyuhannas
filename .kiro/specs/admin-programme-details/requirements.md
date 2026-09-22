# Requirements Document

## Introduction

This feature will create an admin programme details page that displays comprehensive information about a specific programme, including its details, registrations, participants, and management actions. The page will be accessible at `/admin/programmes/[id]` and will integrate seamlessly with the existing admin layout.

## Glossary

- **Admin_Programme_Details_System**: The web application component that displays detailed information about a specific programme in the admin interface
- **Programme**: A competition or event with specific rules, categories, and participant requirements
- **Registration**: A team's enrollment in a specific programme with their participant details
- **Participant**: An individual team member registered for a programme, identified by chest number
- **Team**: A group of participants with a unique code, name, and color
- **Admin_Layout**: The existing administrative interface layout with sidebar, header, and protected routes

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to view detailed information about a specific programme, so that I can manage and monitor that programme effectively.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/programmes/[id]`, THE Admin_Programme_Details_System SHALL display the programme details page within the Admin_Layout
2. THE Admin_Programme_Details_System SHALL fetch and display programme information including code, name, category, section, position type, and participant requirements
3. THE Admin_Programme_Details_System SHALL show a loading state while fetching programme data
4. IF the programme does not exist, THEN THE Admin_Programme_Details_System SHALL display an appropriate error message
5. THE Admin_Programme_Details_System SHALL include breadcrumb navigation showing the path from programmes list to the specific programme

### Requirement 2

**User Story:** As an admin user, I want to see all team registrations for a programme, so that I can monitor participation and manage registrations.

#### Acceptance Criteria

1. THE Admin_Programme_Details_System SHALL display a list of all teams registered for the programme
2. THE Admin_Programme_Details_System SHALL show team information including team code, name, description, and team color
3. THE Admin_Programme_Details_System SHALL display participant details for each registered team including chest numbers
4. THE Admin_Programme_Details_System SHALL show registration status for each team
5. WHERE no teams are registered, THE Admin_Programme_Details_System SHALL display an appropriate empty state message

### Requirement 3

**User Story:** As an admin user, I want to see programme statistics and summary information, so that I can quickly understand the programme's status and participation levels.

#### Acceptance Criteria

1. THE Admin_Programme_Details_System SHALL display total number of registered teams
2. THE Admin_Programme_Details_System SHALL show total number of participants across all teams
3. THE Admin_Programme_Details_System SHALL calculate and display participation rate based on required participants
4. THE Admin_Programme_Details_System SHALL show programme status and category information
5. THE Admin_Programme_Details_System SHALL display programme requirements and constraints

### Requirement 4

**User Story:** As an admin user, I want to perform management actions on the programme, so that I can maintain and update programme information as needed.

#### Acceptance Criteria

1. THE Admin_Programme_Details_System SHALL provide an edit button that navigates to programme editing functionality
2. THE Admin_Programme_Details_System SHALL include a delete button with confirmation dialog for programme removal
3. THE Admin_Programme_Details_System SHALL provide a back button or link to return to the programmes list
4. THE Admin_Programme_Details_System SHALL show action buttons in a consistent and accessible manner
5. WHERE management actions are performed, THE Admin_Programme_Details_System SHALL provide appropriate feedback to the user