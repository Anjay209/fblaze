# Firebase Security Rules Explanation

## Overview
These Firebase security rules provide comprehensive protection for your CertQuest application while maintaining functionality for all user roles.

## Key Security Features

### 1. **Authentication Required**
- All operations require authentication except:
  - Public read access to submissions folder in Storage
  - Public read access to profile pictures

### 2. **Role-Based Access Control**
The rules support the following roles:
- **Member**: Basic user with limited permissions
- **Officer**: Similar to member
- **Individual**: Standard user account
- **Mentor**: Can create assignments and access mentee data
- **Advisor**: Can manage competitions, resources, and assignments
- **Chapter**: Similar to advisor
- **Admin**: (Future) Full administrative access

### 3. **Data Ownership**
- Users can only read/write their own data unless explicitly allowed
- Assignments are protected by the `to` field (recipient)
- Notifications are user-specific via `menteeId` or `userId`

## Firestore Rules Breakdown

### Users Collection
- **Read**: Any authenticated user (for leaderboards, etc.)
- **Create**: Users can create their own profile
- **Update**: Users can update their own profile, but cannot maliciously change `isAdmin` or `isMentor` fields
- **Subcollections**: Users can manage their own assignments and meetings

### Assignments Collection
- **Read**: Users can read assignments assigned to them (`to` field matches their UID)
- **Create**: Only mentors, advisors, and chapters can create assignments
- **Update**: 
  - Recipients can update assignments (to submit answers)
  - Creators can update any field
  - Recipients cannot change critical fields like `to`, `type`, `createdBy`
- **Delete**: Only creators, mentors, advisors, or chapters can delete

### Notifications Collection
- **Read**: Users can only read their own notifications
- **Create**: System, mentors, advisors can create notifications
- **Update**: Users can only update read status and showModal flag
- **Delete**: Users can delete their own notifications

### Forum Questions Collection
- **Read**: All authenticated users
- **Create**: Any authenticated user can post questions
- **Update**: Users can update their own questions; mentors/advisors can mark as solved
- **Delete**: Users can delete their own questions

### Competitions Collection
- **Read**: All authenticated users
- **Write**: Only advisors, chapters, or admins

### Competition Submissions Collection
- **Read**: Users can read their own submissions; advisors can read all
- **Create**: Any authenticated user
- **Update/Delete**: Users can manage their own; advisors can manage all

### User Training Collection
- **Read/Write**: Users can only access their own training data
- Includes subcollections: `entries`, `trainingEntries`

### Resources Collection
- **Read**: All authenticated users
- **Write**: Only advisors, chapters, or admins

## Storage Rules Breakdown

### Submissions Folder (`/submissions/{fileName}`)
- **Read**: Public (for sharing/viewing submissions)
- **Write**: Authenticated users, 5MB limit, video/audio/PDF/image only

### Training Folder (`/training/{userId}/{fileName}`)
- **Read/Write**: Users can only access their own training files
- **Size Limit**: 15MB
- **Content Type**: PDF only

### Profile Pictures (`/profilePictures/{userId}/{fileName}`)
- **Read**: Public
- **Write**: Users can upload their own, 2MB limit, images only

### Assignment Submissions (`/assignmentSubmissions/{userId}/{assignmentId}/{fileName}`)
- **Read/Write**: Users can only access their own submissions
- **Size Limit**: 10MB

## Performance Considerations

### Using `get()` in Rules
The rules use `get()` to fetch user data for role checks (isMentor, isAdvisor, etc.). This:
- **Counts as a read operation** each time it's called
- **Is necessary** for security-critical role checks
- **Is cached** by Firebase for the duration of the request

### Optimization Tips
1. **Cache user data** in your client application to minimize rule evaluations
2. **Batch operations** when possible to reduce rule evaluation overhead
3. **Use indexes** for queries (already configured in `firestore.indexes.json`)

## Security Best Practices Implemented

1. ✅ **Principle of Least Privilege**: Users only get minimum necessary permissions
2. ✅ **Data Validation**: Rules validate required fields and data types
3. ✅ **Field-Level Protection**: Critical fields (like `isAdmin`) are protected
4. ✅ **Size Limits**: Storage uploads have size restrictions
5. ✅ **Content Type Validation**: Storage rules validate file types
6. ✅ **Default Deny**: All unspecified paths are denied by default

## Testing Your Rules

### Test Scenarios to Verify

1. **User Profile Access**
   - ✅ User can read their own profile
   - ✅ User can update their own profile
   - ❌ User cannot change `isAdmin` to true
   - ❌ User cannot read other users' private data

2. **Assignment Access**
   - ✅ User can read assignments where `to` == their UID
   - ✅ Mentor can create assignments
   - ✅ User can update assignments assigned to them
   - ❌ User cannot change `to` field in assignments

3. **Notifications**
   - ✅ User can read their own notifications
   - ✅ User can mark notifications as read
   - ❌ User cannot read other users' notifications

4. **Storage Access**
   - ✅ User can upload to their own training folder
   - ✅ Public can read submissions
   - ❌ User cannot access other users' training files

## Deployment

To deploy these rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Monitoring

Monitor rule violations in Firebase Console:
- **Firestore**: Firestore > Rules > Usage tab
- **Storage**: Storage > Rules > Usage tab

## Future Enhancements

Consider adding:
1. **Rate Limiting**: Prevent abuse of write operations
2. **Audit Logging**: Track sensitive operations
3. **Custom Claims**: Use Firebase Auth custom claims for roles (more efficient than document reads)
4. **Time-based Rules**: Expire certain documents automatically

## Support

If you encounter permission errors:
1. Check that the user is authenticated
2. Verify the user's role in the `users` collection
3. Check that required fields are present in documents
4. Review Firebase Console logs for specific rule failures
