# Permission-Based Data Fetching Guide

## Overview

This guide explains how to implement permission-based data fetching for programs and institutes, where different user types see different data based on their assigned permissions and program assignments.

## Permission Logic

### User Types and Access Levels

Based on your `models.py`, here are the different user types and their access levels:

#### **Program Access:**
1. **Admin (`isAdmin = true`)**
   - **Access**: ALL programs
   - **Logic**: Full system access

2. **Co-Admin with CRUD permissions (`isCoAdmin = true` + `crudProgramEnable = true`)**
   - **Access**: ALL programs
   - **Logic**: Has management permissions

3. **Co-Admin without CRUD permissions (`isCoAdmin = true` + `crudProgramEnable = false`)**
   - **Access**: Only assigned programs
   - **Logic**: Limited to assigned resources

4. **Regular User with CRUD permissions (`isAdmin = false` + `crudProgramEnable = true`)**
   - **Access**: ALL programs
   - **Logic**: Has specific management permissions

5. **Regular User without CRUD permissions (`isAdmin = false` + `crudProgramEnable = false`)**
   - **Access**: Only assigned programs
   - **Logic**: Limited to assigned resources

#### **Institute Access:**
- **All Users**: Can see ALL institutes regardless of permissions
- **Logic**: Institutes are publicly visible to all authenticated users

## Database Relationships

### Key Tables and Relationships

```sql
-- Employee table (users)
Employee {
  employeeID (PK)
  isAdmin
  isCoAdmin
  crudProgramEnable
  crudInstituteEnable
  ...
}

-- Junction table linking employees to programs
EmployeeProgram {
  employeeID (FK -> Employee.employeeID)
  programID (FK -> Program.programID)
}

-- Programs table
Program {
  programID (PK)
  instID (FK -> Institute.instID)
  programName
  ...
}

-- Institutes table
Institute {
  instID (PK)
  instName
  ...
}
```

## Backend Implementation

### Enhanced Program Endpoint (`/api/program`)

```python
@app.route('/api/program', methods=['GET'])
@jwt_required()
def get_user_program():
    try:
        current_user_id = get_jwt_identity()
        current_user = Employee.query.filter_by(employeeID=current_user_id).first()
        
        # Determine user access level
        is_admin = current_user.isAdmin
        is_co_admin = current_user.isCoAdmin
        has_program_crud = current_user.crudProgramEnable
        
        if is_admin or has_program_crud:
            # Full access - return all programs
            programs = Program.query.all()
            access_level = 'full'
        else:
            # Limited access - return only assigned programs
            user_program_ids = [ep.programID for ep in current_user.employee_programs]
            if user_program_ids:
                programs = Program.query.filter(Program.programID.in_(user_program_ids)).all()
            else:
                programs = []  # No assigned programs
            access_level = 'assigned'
            
        # Build response with additional metadata
        return jsonify({
            'success': True,
            'programs': program_list,
            'accessLevel': access_level,
            'userPermissions': {
                'isAdmin': is_admin,
                'isCoAdmin': is_co_admin,
                'crudProgramEnable': has_program_crud,
                'assignedProgramCount': len(current_user.employee_programs)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to fetch programs'}), 500
```

### Enhanced Institute Endpoint (`/api/institute`)

```python
@app.route('/api/institute', methods=['GET'])
@jwt_required()
def get_institute():
    try:
        current_user_id = get_jwt_identity()
        current_user = Employee.query.filter_by(employeeID=current_user_id).first()
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # All users can see all institutes
        institutes = Institute.query.all()
                
        institute_list = []

        for institute in institutes:
            dean = institute.dean
            
            # Get program count for this institute
            program_count = Program.query.filter_by(instID=institute.instID).count()

            institute_data = {
                'instID': institute.instID,
                'instDean': f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A",
                'instCode': institute.instCode,
                'instName': institute.instName,
                'instPic': institute.instPic,
                'employeeID': institute.employeeID,
                'programCount': program_count
            } 
            institute_list.append(institute_data)
            
        return jsonify({
            'success': True,
            'institutes': institute_list,
            'accessLevel': 'full',
            'userPermissions': {
                'isAdmin': current_user.isAdmin,
                'isCoAdmin': current_user.isCoAdmin,
                'crudInstituteEnable': current_user.crudInstituteEnable,
                'assignedProgramCount': len(current_user.employee_programs)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to fetch institutes'}), 500
```

## Frontend Implementation

### Enhanced fetchPrograms Function

```javascript
const fetchPrograms = async () => {
    setProgramLoading(true)

    try {
        const response = await apiGet(`/api/program`);

        if (response?.success || response?.data?.success) {
            const programsArr = response.data?.programs ?? response.programs ?? [];
            const accessLevel = response.data?.accessLevel ?? response.accessLevel;
            const userPermissions = response.data?.userPermissions ?? response.userPermissions;

            setPrograms(programsArr);
            
            // Log user access information for debugging
            console.log('Program Access Info:', {
                accessLevel,
                userPermissions,
                programCount: programsArr.length
            });

            // Show user-friendly message based on access level
            if (accessLevel === 'assigned' && programsArr.length === 0) {
                console.log('User has no assigned programs');
            } else if (accessLevel === 'full') {
                console.log('User has full program access');
            } else {
                console.log(`User has access to ${programsArr.length} assigned programs`);
            }

        } else {
            console.error('Failed to fetch the programs:', response.error || response);
            setPrograms([]);
        }

    } catch (err) {
        console.error("Error occurred when fetching programs", err);
        setPrograms([]);
    } finally {
        setProgramLoading(false);
    }
};
```

## Response Structure

### Program Response Example

```json
{
    "success": true,
    "programs": [
        {
            "programID": 1,
            "programDean": "John Doe",
            "programCode": "CS101",
            "programName": "Computer Science",
            "programColor": "#3B82F6",
            "employeeID": "EMP001",
            "instID": 1,
            "instituteName": "Engineering Institute",
            "instituteCode": "ENG"
        }
    ],
    "accessLevel": "assigned",
    "userPermissions": {
        "isAdmin": false,
        "isCoAdmin": true,
        "crudProgramEnable": false,
        "assignedProgramCount": 3
    }
}
```

### Institute Response Example

```json
{
    "success": true,
    "institutes": [
        {
            "instID": 1,
            "instDean": "Jane Smith",
            "instCode": "ENG",
            "instName": "Engineering Institute",
            "instPic": "path/to/image.jpg",
            "employeeID": "EMP002",
            "programCount": 5
        }
    ],
    "accessLevel": "full",
    "userPermissions": {
        "isAdmin": true,
        "isCoAdmin": false,
        "crudInstituteEnable": true,
        "assignedProgramCount": 0
    }
}
```

## Access Level Meanings

### `accessLevel: "full"`
- User can see ALL programs/institutes in the system
- Granted to: Admins and users with CRUD permissions

### `accessLevel: "assigned"`
- User can only see programs/institutes they are assigned to
- Granted to: Regular users and co-admins without CRUD permissions

## User Permission Fields

### `userPermissions` Object
- **`isAdmin`**: Boolean - User is a system administrator
- **`isCoAdmin`**: Boolean - User is a co-administrator
- **`crudProgramEnable`**: Boolean - User can manage programs
- **`crudInstituteEnable`**: Boolean - User can manage institutes
- **`assignedProgramCount`**: Number - Count of programs assigned to user

## Frontend UI Considerations

### Displaying Access Information

```javascript
// Show different UI based on access level
const renderAccessInfo = (accessLevel, userPermissions, count) => {
    if (accessLevel === 'full') {
        return (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-blue-800">
                    🔓 You have full access to all programs/institutes
                </p>
            </div>
        );
    } else {
        return (
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <p className="text-yellow-800">
                    🔒 You can access {count} assigned program(s)/institute(s)
                </p>
            </div>
        );
    }
};
```

### Conditional Feature Display

```javascript
// Show create/edit buttons only for users with appropriate permissions
const canCreateProgram = userPermissions?.isAdmin || userPermissions?.crudProgramEnable;

return (
    <div>
        {canCreateProgram && (
            <button onClick={handleCreateProgram}>
                Create New Program
            </button>
        )}
        {/* Rest of component */}
    </div>
);
```

## Testing Scenarios

### Test Cases to Verify

#### **Program Access Tests:**
1. **Admin User**
   - Should see all programs
   - `accessLevel` should be "full"
   - `userPermissions.isAdmin` should be `true`

2. **Co-Admin with CRUD permissions**
   - Should see all programs
   - `accessLevel` should be "full"
   - `userPermissions.isCoAdmin` should be `true`
   - `userPermissions.crudProgramEnable` should be `true`

3. **Co-Admin without CRUD permissions**
   - Should see only assigned programs
   - `accessLevel` should be "assigned"
   - `userPermissions.isCoAdmin` should be `true`
   - `userPermissions.crudProgramEnable` should be `false`

4. **Regular User with CRUD permissions**
   - Should see all programs
   - `accessLevel` should be "full"
   - `userPermissions.isAdmin` should be `false`
   - `userPermissions.crudProgramEnable` should be `true`

5. **Regular User without CRUD permissions**
   - Should see only assigned programs
   - `accessLevel` should be "assigned"
   - `userPermissions.isAdmin` should be `false`
   - `userPermissions.crudProgramEnable` should be `false`

6. **User with No Assigned Programs**
   - Should see empty program arrays
   - `accessLevel` should be "assigned"
   - `assignedProgramCount` should be 0

#### **Institute Access Tests:**
- **All User Types**: Should see ALL institutes
- `accessLevel` should always be "full" for institutes
- No permission-based filtering for institutes

## Security Considerations

1. **JWT Token Validation**: All endpoints require valid JWT tokens
2. **Permission Checking**: Server-side validation of user permissions
3. **Data Filtering**: Database queries filter data based on user assignments
4. **Error Handling**: Graceful handling of permission errors
5. **Audit Trail**: Consider logging access attempts for security monitoring

## Performance Optimizations

1. **Database Indexing**: Ensure proper indexes on foreign keys
2. **Query Optimization**: Use efficient joins and filters
3. **Caching**: Consider caching user permissions and assignments
4. **Pagination**: Implement pagination for large datasets

## Troubleshooting

### Common Issues

1. **Empty Results**: Check if user has assigned programs
2. **Permission Errors**: Verify user permissions in database
3. **JWT Issues**: Ensure token is valid and not expired
4. **Database Errors**: Check foreign key relationships

### Debug Information

The enhanced endpoints provide detailed logging information:
- Access level determination
- User permission status
- Program/institute counts
- Database query results

This information is available in the browser console and server logs for debugging purposes.
