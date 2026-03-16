# Per-User API Key Implementation - Deployment Checklist

## Pre-Deployment

### Code Review
- [ ] Review `leadFinderWebSearchService.js` changes
- [ ] Review `leadFinderService.js` changes
- [ ] Verify no hardcoded API keys remain
- [ ] Check error handling is comprehensive
- [ ] Verify logging is adequate

### Testing
- [ ] Test with user API key
- [ ] Test with global API key fallback
- [ ] Test with no API key (should error)
- [ ] Test website discovery
- [ ] Test lead extraction
- [ ] Test lead storage
- [ ] Test dashboard display
- [ ] Test filtering and sorting
- [ ] Test export functionality

### Database
- [ ] Verify `lead_finder_config` collection exists
- [ ] Verify `leads` collection exists
- [ ] Verify `activity_logs` collection exists
- [ ] Create Firestore indexes if needed:
  - [ ] `leads`: userId + source + createdAt
  - [ ] `leads`: userId + lead_score
  - [ ] `lead_finder_config`: user_id

### Documentation
- [ ] Review PER_USER_API_KEY_IMPLEMENTATION.md
- [ ] Review PER_USER_API_KEY_QUICK_REFERENCE.md
- [ ] Review EXACT_CODE_CHANGES.md
- [ ] Update README if needed
- [ ] Update user documentation

## Deployment

### Step 1: Code Changes
- [ ] Update `functions/src/services/leadFinderWebSearchService.js`
  - [ ] Add `userSerpApiKey` parameter to `searchWithSerpAPI()`
  - [ ] Add `userSerpApiKey` parameter to `searchWebsites()`
  - [ ] Update logging to show which API key is used
  
- [ ] Update `functions/src/services/leadFinderService.js`
  - [ ] Fetch user's API key from `lead_finder_config`
  - [ ] Validate API key exists
  - [ ] Pass user's API key to `searchWebsites()`
  - [ ] Update activity logging

### Step 2: Local Testing
```bash
# Start emulators
firebase emulators:start

# Run test cases
npm test

# Check logs
firebase functions:log
```

- [ ] All tests pass
- [ ] No errors in logs
- [ ] Leads are extracted correctly
- [ ] Dashboard displays leads

### Step 3: Staging Deployment
```bash
# Deploy to staging
firebase use staging
firebase deploy --only functions
```

- [ ] Functions deployed successfully
- [ ] No errors in Cloud Functions logs
- [ ] Test with real user
- [ ] Verify leads are extracted
- [ ] Verify dashboard displays leads

### Step 4: Production Deployment
```bash
# Switch to production
firebase use production

# Deploy
firebase deploy --only functions
```

- [ ] Functions deployed successfully
- [ ] No errors in Cloud Functions logs
- [ ] Monitor for 24 hours
- [ ] Check activity logs
- [ ] Verify user feedback

## Post-Deployment

### Monitoring
- [ ] Monitor Cloud Functions logs for errors
- [ ] Monitor Firestore for data consistency
- [ ] Monitor API usage
- [ ] Check for rate limiting issues
- [ ] Monitor performance metrics

### User Communication
- [ ] Notify users about new feature
- [ ] Provide instructions for adding API key
- [ ] Provide support contact information
- [ ] Monitor support tickets

### Verification
- [ ] Verify leads are being extracted
- [ ] Verify leads are displaying in dashboard
- [ ] Verify filtering and sorting work
- [ ] Verify export functionality works
- [ ] Verify no data loss

### Rollback Plan
If critical issues occur:
```bash
# Revert to previous version
git checkout HEAD~1 functions/src/services/leadFinderService.js
git checkout HEAD~1 functions/src/services/leadFinderWebSearchService.js

# Deploy
firebase deploy --only functions
```

- [ ] Rollback procedure documented
- [ ] Team trained on rollback
- [ ] Rollback tested in staging

## Performance Validation

### Metrics to Monitor
- [ ] Job completion time (target: < 4 hours for 500 websites)
- [ ] Lead extraction rate (target: > 50% of websites)
- [ ] API response time (target: < 2 seconds)
- [ ] Database query time (target: < 500ms)
- [ ] Error rate (target: < 1%)

### Load Testing
- [ ] Test with 10 concurrent jobs
- [ ] Test with 100 concurrent users
- [ ] Test with 10,000 leads in database
- [ ] Monitor resource usage
- [ ] Check for bottlenecks

## Security Validation

### API Key Security
- [ ] API keys are encrypted in Firestore
- [ ] API keys are never logged in full
- [ ] API keys are only accessible to user and admins
- [ ] API keys are rotated periodically
- [ ] Compromised keys can be revoked

### Data Privacy
- [ ] User data is isolated per user
- [ ] No cross-user data leakage
- [ ] Leads are deleted after 7 days (if configured)
- [ ] Activity logs are retained for audit
- [ ] GDPR compliance verified

### Access Control
- [ ] Users can only access their own leads
- [ ] Admins can view all leads
- [ ] API key never sent to frontend
- [ ] All API calls are server-side
- [ ] Rate limiting is enforced

## Documentation

### User Documentation
- [ ] How to add SERP API key
- [ ] How to start Lead Finder job
- [ ] How to view leads in dashboard
- [ ] How to filter and sort leads
- [ ] How to export leads
- [ ] Troubleshooting guide

### Developer Documentation
- [ ] Architecture overview
- [ ] Database schema
- [ ] API reference
- [ ] Code examples
- [ ] Deployment guide

### Support Documentation
- [ ] Common issues and solutions
- [ ] FAQ
- [ ] Contact information
- [ ] Escalation procedures

## Sign-Off

### Development Team
- [ ] Code review completed
- [ ] Tests passed
- [ ] Documentation reviewed
- [ ] Ready for deployment

**Developer Name**: _______________
**Date**: _______________
**Signature**: _______________

### QA Team
- [ ] Functional testing completed
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] Ready for production

**QA Lead Name**: _______________
**Date**: _______________
**Signature**: _______________

### Product Team
- [ ] Feature meets requirements
- [ ] User documentation complete
- [ ] Support team trained
- [ ] Ready for release

**Product Manager Name**: _______________
**Date**: _______________
**Signature**: _______________

### Operations Team
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Ready for deployment

**Ops Lead Name**: _______________
**Date**: _______________
**Signature**: _______________

## Deployment Timeline

### Day 1: Pre-Deployment
- [ ] 09:00 - Code review meeting
- [ ] 10:00 - Testing begins
- [ ] 14:00 - Staging deployment
- [ ] 16:00 - Staging verification

### Day 2: Production Deployment
- [ ] 09:00 - Final checks
- [ ] 10:00 - Production deployment
- [ ] 11:00 - Verification
- [ ] 12:00 - User notification
- [ ] 14:00 - Monitoring begins

### Day 3-7: Post-Deployment
- [ ] Daily monitoring
- [ ] User feedback collection
- [ ] Issue resolution
- [ ] Performance optimization

## Success Criteria

### Functional
- [ ] Users can add SERP API key
- [ ] Lead Finder jobs use user's API key
- [ ] Leads are extracted and stored
- [ ] Dashboard displays leads correctly
- [ ] Filtering and sorting work
- [ ] Export functionality works

### Performance
- [ ] Job completion time < 4 hours
- [ ] Lead extraction rate > 50%
- [ ] API response time < 2 seconds
- [ ] Database query time < 500ms
- [ ] Error rate < 1%

### Security
- [ ] API keys are encrypted
- [ ] User data is isolated
- [ ] No data leakage
- [ ] Access control enforced
- [ ] Rate limiting works

### User Experience
- [ ] Users understand how to add API key
- [ ] Dashboard is intuitive
- [ ] Filtering is easy to use
- [ ] Export is straightforward
- [ ] Support is responsive

## Post-Deployment Review

### Week 1
- [ ] Monitor logs for errors
- [ ] Collect user feedback
- [ ] Verify performance metrics
- [ ] Check security logs
- [ ] Address any issues

### Week 2-4
- [ ] Analyze usage patterns
- [ ] Optimize performance
- [ ] Improve documentation
- [ ] Plan next features
- [ ] Gather metrics

### Month 2+
- [ ] Monitor long-term stability
- [ ] Plan enhancements
- [ ] Gather user feedback
- [ ] Plan next release

## Lessons Learned

### What Went Well
- [ ] 
- [ ] 
- [ ] 

### What Could Be Improved
- [ ] 
- [ ] 
- [ ] 

### Action Items for Next Release
- [ ] 
- [ ] 
- [ ] 

## Sign-Off

**Deployment Completed**: _______________
**Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________

---

## Contact Information

**Development Lead**: [name] - [email] - [phone]
**QA Lead**: [name] - [email] - [phone]
**Product Manager**: [name] - [email] - [phone]
**Operations Lead**: [name] - [email] - [phone]
**Support Lead**: [name] - [email] - [phone]

## Emergency Contacts

**On-Call Engineer**: [name] - [phone]
**Escalation Manager**: [name] - [phone]
**Executive Sponsor**: [name] - [phone]
