# Deploy Firebase Rules

The Firestore rules have been updated to completely remove all restrictions for assignments.

## Current Rules Status

### Assignments Collection
- **Path**: `/assignments/{assignmentId}`
- **Rules**: `allow read, write: if true;` (NO RESTRICTIONS)

### Users Subcollection
- **Path**: `/users/{userId}/assignments/{assignmentId}`
- **Rules**: `allow read, write: if true;` (NO RESTRICTIONS)

## Deploy Command

Run this command to deploy the updated rules:

```bash
firebase deploy --only firestore:rules
```

## After Deployment

1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache** if needed
3. **Test assignment submissions** again

The rules are now completely open - no authentication, no ownership checks, no restrictions whatsoever.
