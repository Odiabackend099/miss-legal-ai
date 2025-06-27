# MISS Legal AI - N8N Workflows Operational Guide

## Overview

This operational guide provides comprehensive instructions for monitoring, maintaining, and troubleshooting the MISS Legal AI N8N automation workflows in production.

## 🚀 Quick Reference

### Essential Commands

```bash
# Deploy all workflows
./scripts/deploy-workflows.sh --api-key YOUR_API_KEY

# Test all workflows
./scripts/test-workflows.sh --verbose

# Quick connectivity check
./scripts/test-workflows.sh --quick

# Monitor workflow executions
curl -H "Authorization: Bearer $N8N_API_KEY" \
  "https://n8n.odia.ltd/api/v1/executions?filter={\"status\":\"error\"}"
```

### Critical Webhook URLs

```
User Onboarding:     https://n8n.odia.ltd/webhook/user-onboarding
Voice Session:       https://n8n.odia.ltd/webhook/voice-session
Emergency Response:  https://n8n.odia.ltd/webhook/emergency-response
Document Generation: https://n8n.odia.ltd/webhook/document-generation
Payment Callback:    https://n8n.odia.ltd/webhook/payment-callback
Lawyer Escalation:   https://n8n.odia.ltd/webhook/lawyer-escalation
```

## 📊 Monitoring & Alerting

### Key Performance Indicators (KPIs)

#### System Health Metrics
- **Workflow Success Rate**: >95% (Critical: <90%)
- **Average Response Time**: <3 seconds (Critical: >10 seconds)
- **Error Rate**: <5% (Critical: >10%)
- **Queue Length**: <10 pending executions (Critical: >50)

#### Business Metrics
- **User Registration Rate**: Track daily signups
- **Document Generation Success**: >90% completion rate
- **Emergency Response Time**: <30 seconds average
- **Payment Success Rate**: >98% for valid transactions
- **Lawyer Consultation Booking Rate**: Track conversion

#### Nigerian Market Specific
- **Language Distribution**: Monitor usage across English, Yoruba, Hausa, Igbo, Pidgin
- **State Coverage**: Track document generation by Nigerian state
- **Local Payment Methods**: Monitor Flutterwave payment method preferences
- **Emergency Response by Region**: Track regional emergency patterns

### Real-Time Monitoring Dashboard

#### N8N Native Monitoring
Access the N8N dashboard at `https://n8n.odia.ltd/` to monitor:
- Active workflows status
- Recent executions
- Error logs
- Performance metrics

#### Custom Monitoring Queries

```sql
-- Check workflow execution status (last 24 hours)
SELECT 
  workflow_name,
  status,
  COUNT(*) as execution_count,
  AVG(execution_time_ms) as avg_time
FROM workflow_executions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY workflow_name, status
ORDER BY workflow_name;

-- Monitor error rates by workflow
SELECT 
  workflow_name,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate
FROM workflow_executions 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY workflow_name
HAVING COUNT(*) > 0;

-- Check emergency response performance
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_response_time_seconds,
  COUNT(CASE WHEN status = 'false_positive' THEN 1 END) * 100.0 / COUNT(*) as false_positive_rate
FROM emergencies 
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

### Alerting Configuration

#### Critical Alerts (Immediate Response Required)

1. **System Health < 70%**
   - **Trigger**: Overall system health drops below 70%
   - **Action**: Page on-call engineer, initiate emergency procedures
   - **Channels**: WhatsApp, Email, SMS

2. **Emergency Detection Failure**
   - **Trigger**: Emergency webhook returns error or times out
   - **Action**: Immediately escalate to technical team
   - **Channels**: WhatsApp, Phone call

3. **Payment Processing Failure Rate > 5%**
   - **Trigger**: Payment webhook error rate exceeds 5% over 15 minutes
   - **Action**: Alert finance and technical teams
   - **Channels**: Email, Slack

4. **Database Connection Loss**
   - **Trigger**: Supabase connection failures
   - **Action**: Initiate backup procedures, alert infrastructure team
   - **Channels**: All channels

#### Warning Alerts (Monitor Closely)

1. **High Response Times**
   - **Trigger**: Average response time > 5 seconds for 10 minutes
   - **Action**: Investigate performance issues

2. **Document Generation Errors**
   - **Trigger**: Document generation error rate > 10%
   - **Action**: Check template and validation services

3. **Low Language Diversity**
   - **Trigger**: Non-English usage < 20% for 24 hours
   - **Action**: Review marketing and user acquisition in local languages

### Monitoring Scripts

#### Health Check Script (`scripts/health-check.sh`)

```bash
#!/bin/bash
# Basic health check for all workflows

WEBHOOKS=("user-onboarding" "voice-session" "emergency-response" "document-generation" "payment-callback" "lawyer-escalation")
HEALTHY=0
TOTAL=${#WEBHOOKS[@]}

for webhook in "${WEBHOOKS[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"health_check": true}' \
        "https://n8n.odia.ltd/webhook/$webhook")
    
    if [[ "$response" =~ ^[2-4][0-9][0-9]$ ]]; then
        ((HEALTHY++))
        echo "✅ $webhook: Healthy"
    else
        echo "❌ $webhook: Unhealthy (HTTP $response)"
    fi
done

echo "Health Status: $HEALTHY/$TOTAL workflows healthy"
exit $((TOTAL - HEALTHY))
```

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Webhook Not Responding

**Symptoms:**
- HTTP 404 or timeout errors
- Webhook executions not appearing in N8N

**Diagnosis:**
```bash
# Test webhook connectivity
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  "https://n8n.odia.ltd/webhook/user-onboarding"

# Check N8N workflow status
curl -H "Authorization: Bearer $N8N_API_KEY" \
  "https://n8n.odia.ltd/api/v1/workflows" | jq '.data[] | select(.name | contains("User Onboarding"))'
```

**Solutions:**
1. Verify workflow is active in N8N dashboard
2. Check webhook URL spelling and path
3. Restart N8N service if necessary
4. Verify network connectivity and firewall rules

#### 2. Database Connection Errors

**Symptoms:**
- Error messages mentioning Supabase or database connection
- Workflows hanging at database operations

**Diagnosis:**
```bash
# Test Supabase connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/users?limit=1"
```

**Solutions:**
1. Check Supabase service status
2. Verify API keys are correct and not expired
3. Check database connection limits
4. Review RLS (Row Level Security) policies

#### 3. Payment Processing Issues

**Symptoms:**
- Payment webhooks failing
- Subscription upgrades not processing

**Diagnosis:**
```bash
# Test Flutterwave API
curl -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY" \
  "https://api.flutterwave.com/v3/transactions"

# Check webhook URL in Flutterwave dashboard
echo "Configured webhook: https://n8n.odia.ltd/webhook/payment-callback"
```

**Solutions:**
1. Verify Flutterwave webhook URL configuration
2. Check API key permissions and expiration
3. Review payment verification logic
4. Test with sandbox environment first

#### 4. Emergency Detection False Positives

**Symptoms:**
- High false positive rate in emergency detection
- Users reporting unnecessary emergency alerts

**Diagnosis:**
```sql
-- Check false positive rate
SELECT 
  COUNT(CASE WHEN status = 'false_positive' THEN 1 END) * 100.0 / COUNT(*) as false_positive_rate,
  AVG(confidence_score) as avg_confidence
FROM emergencies 
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Solutions:**
1. Adjust confidence thresholds in emergency detection
2. Improve training data for emergency classification
3. Implement user feedback mechanism
4. Review and update emergency keywords list

#### 5. Multi-Language Processing Issues

**Symptoms:**
- Documents generated in wrong language
- Voice processing errors for local languages

**Solutions:**
1. Verify language detection accuracy
2. Check template availability for all languages
3. Update language-specific prompts
4. Test with native speakers

### Error Code Reference

#### HTTP Status Codes

- **200**: Success - Request processed successfully
- **201**: Created - Resource created successfully (e.g., new user, document)
- **202**: Accepted - Request accepted for processing (e.g., clarification needed)
- **400**: Bad Request - Invalid input data or missing required fields
- **401**: Unauthorized - Authentication failed or missing API key
- **404**: Not Found - Webhook endpoint not found or workflow inactive
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Workflow execution error
- **503**: Service Unavailable - External service (Supabase, Flutterwave) unavailable

#### Custom Error Codes

- **VOICE_001**: Voice processing timeout
- **VOICE_002**: Language detection failed
- **VOICE_003**: Audio quality too low
- **DOC_001**: Template not found
- **DOC_002**: Legal validation failed
- **DOC_003**: PDF generation error
- **EMRG_001**: Emergency confidence too low
- **EMRG_002**: Emergency contacts not found
- **PAY_001**: Payment verification failed
- **PAY_002**: Subscription limit exceeded
- **LAW_001**: No lawyers available
- **LAW_002**: Consultation limit exceeded

## 🔄 Maintenance Procedures

### Daily Maintenance Tasks

1. **Health Check** (Automated - 06:00 WAT)
   - Run health check script
   - Review error logs from previous 24 hours
   - Check queue lengths and processing times

2. **Performance Review** (Manual - 08:00 WAT)
   - Review yesterday's analytics report
   - Check for trending issues or patterns
   - Verify payment reconciliation

3. **Emergency System Test** (Automated - 12:00 WAT)
   - Test emergency detection with known scenarios
   - Verify notification delivery times
   - Check false positive rates

### Weekly Maintenance Tasks

1. **Comprehensive Testing** (Sunday 02:00 WAT)
   - Run full test suite on all workflows
   - Load testing with realistic traffic patterns
   - Integration testing with all external services

2. **Database Maintenance** (Sunday 03:00 WAT)
   - Database cleanup and optimization
   - Archive old analytics data
   - Vacuum and reindex operations

3. **Security Review** (Friday)
   - Review access logs
   - Check for suspicious activity patterns
   - Update API keys if necessary

### Monthly Maintenance Tasks

1. **Legal Compliance Review**
   - Update legal templates if required
   - Review stamp duty rates for all states
   - Check for new legal requirements

2. **Performance Optimization**
   - Analyze workflow performance trends
   - Optimize slow-running operations
   - Review and adjust rate limits

3. **Business Intelligence Review**
   - Generate comprehensive business reports
   - Analyze user behavior patterns
   - Review market penetration by state/language

4. **Disaster Recovery Testing**
   - Test backup and recovery procedures
   - Validate data integrity
   - Update disaster recovery documentation

### Backup and Recovery

#### Automated Backups

1. **Database Backups**
   - **Frequency**: Every 6 hours
   - **Retention**: 30 days for hourly, 90 days for daily
   - **Location**: AWS S3 with versioning
   - **Verification**: Automated restore testing weekly

2. **Configuration Backups**
   - **Frequency**: Daily
   - **Includes**: N8N workflows, environment variables, templates
   - **Location**: Git repository with encryption

3. **Logs and Analytics**
   - **Frequency**: Daily
   - **Retention**: 1 year for compliance
   - **Location**: Compressed archives in S3

#### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from latest backup
   pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME latest_backup.sql
   
   # Verify data integrity
   ./scripts/verify-data-integrity.sh
   ```

2. **Workflow Recovery**
   ```bash
   # Re-deploy all workflows
   ./scripts/deploy-workflows.sh --force --api-key $N8N_API_KEY
   
   # Verify deployment
   ./scripts/test-workflows.sh --quick
   ```

3. **Configuration Recovery**
   ```bash
   # Restore environment variables
   cp backup/.env .env
   
   # Restart services
   systemctl restart n8n
   ```

## 📈 Performance Optimization

### Workflow Optimization Guidelines

1. **Reduce External API Calls**
   - Cache frequently accessed data
   - Batch API requests where possible
   - Implement circuit breakers for external services

2. **Database Query Optimization**
   - Use appropriate indexes
   - Limit result sets with pagination
   - Use read replicas for analytics queries

3. **Memory Management**
   - Process large files in chunks
   - Clear variables after use
   - Monitor memory usage patterns

4. **Nigerian Network Optimization**
   - Use CDN for static assets
   - Optimize for mobile data usage
   - Implement progressive loading

### Scaling Considerations

#### Horizontal Scaling

1. **Load Balancing**
   - Multiple N8N instances behind load balancer
   - Session affinity for stateful operations
   - Health check configuration

2. **Database Scaling**
   - Read replicas for analytics
   - Connection pooling
   - Partitioning for large tables

3. **Queue Management**
   - Redis for job queuing
   - Priority queues for emergency operations
   - Dead letter queues for failed jobs

#### Vertical Scaling

1. **CPU Optimization**
   - Profile CPU-intensive operations
   - Use worker threads for parallel processing
   - Optimize algorithm complexity

2. **Memory Optimization**
   - Monitor memory leaks
   - Optimize data structures
   - Use streaming for large datasets

3. **Storage Optimization**
   - SSD for database storage
   - Archive old data to cheaper storage
   - Optimize file formats (Parquet for analytics)

## 🔐 Security Best Practices

### API Key Management

1. **Rotation Schedule**
   - N8N API keys: Every 90 days
   - External service keys: Per service policy
   - Database credentials: Every 180 days

2. **Storage Security**
   - Use environment variables for secrets
   - Encrypt secrets at rest
   - Never commit secrets to version control

3. **Access Control**
   - Principle of least privilege
   - Regular access reviews
   - Audit logs for secret access

### Network Security

1. **HTTPS Everywhere**
   - TLS 1.3 for all external communications
   - Certificate management and renewal
   - HSTS headers for web interfaces

2. **Firewall Configuration**
   - Allow only necessary ports
   - IP whitelisting for admin access
   - DDoS protection at network level

3. **VPN Access**
   - VPN required for administrative access
   - Multi-factor authentication
   - Regular VPN log reviews

### Data Protection (NDPR Compliance)

1. **Data Minimization**
   - Collect only necessary data
   - Regular data purging
   - Anonymization for analytics

2. **Consent Management**
   - Clear consent mechanisms
   - Consent withdrawal processing
   - Audit trail for consent changes

3. **Data Subject Rights**
   - Right to access procedures
   - Right to deletion (Right to be forgotten)
   - Data portability mechanisms

## 📞 Support and Escalation

### Support Contacts

#### Level 1 Support (General Issues)
- **Email**: support@misslegai.com
- **WhatsApp**: +234-XXX-XXXX-XXX
- **Hours**: 24/7 for critical issues, 9 AM - 6 PM WAT for general

#### Level 2 Support (Technical Issues)
- **Email**: tech@misslegai.com
- **Slack**: #miss-legal-ai-tech
- **On-call**: Rotating schedule for critical issues

#### Level 3 Support (System Administration)
- **Email**: admin@misslegai.com
- **Phone**: +234-XXX-XXXX-XXX (Emergency only)
- **PagerDuty**: For critical system alerts

### Escalation Matrix

#### Severity Levels

1. **Critical (P1)**
   - System completely down
   - Emergency detection not working
   - Payment processing completely failed
   - **Response Time**: 15 minutes
   - **Resolution Time**: 2 hours

2. **High (P2)**
   - Degraded performance affecting all users
   - Key workflow errors
   - Security incidents
   - **Response Time**: 1 hour
   - **Resolution Time**: 8 hours

3. **Medium (P3)**
   - Feature not working for some users
   - Non-critical workflow errors
   - **Response Time**: 4 hours
   - **Resolution Time**: 24 hours

4. **Low (P4)**
   - Minor bugs or enhancement requests
   - **Response Time**: 24 hours
   - **Resolution Time**: 1 week

### Incident Response Procedures

#### Critical Incident Response

1. **Immediate Actions (0-15 minutes)**
   - Acknowledge alert
   - Assess impact and severity
   - Notify on-call team
   - Begin initial troubleshooting

2. **Investigation (15-60 minutes)**
   - Identify root cause
   - Implement immediate workarounds
   - Communicate status to stakeholders
   - Escalate if necessary

3. **Resolution (1-2 hours)**
   - Implement fix
   - Verify system functionality
   - Monitor for side effects
   - Update stakeholders

4. **Post-Incident (24-48 hours)**
   - Conduct post-mortem
   - Document lessons learned
   - Implement preventive measures
   - Update procedures

## 📚 Additional Resources

### Documentation Links
- [N8N Official Documentation](https://docs.n8n.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Flutterwave API Documentation](https://developer.flutterwave.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

### Training Materials
- [N8N Workflow Best Practices](https://docs.n8n.io/workflows/best-practices/)
- [Nigerian Legal System Overview](../docs/nigeria-legal-system.md)
- [NDPR Compliance Guide](../docs/ndpr-compliance.md)

### Tools and Utilities
- [N8N CLI](https://docs.n8n.io/hosting/cli-commands/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Monitoring Dashboard](https://grafana.misslegai.com)
- [Log Aggregation](https://elk.misslegai.com)

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-02-15  

For questions or suggestions about this operational guide, contact: tech@misslegai.com
