#!/bin/bash

# MISS Legal AI - N8N Workflow Deployment Script
# This script imports and configures all workflows for MISS Legal AI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOWS_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$WORKFLOWS_DIR/config"
LOG_FILE="$WORKFLOWS_DIR/deployment.log"

# Default values
N8N_HOST="${N8N_HOST:-n8n.odia.ltd}"
N8N_PROTOCOL="${N8N_PROTOCOL:-https}"
N8N_API_KEY="${N8N_API_KEY:-}"
DRY_RUN=false
FORCE=false
VERBOSE=false

# Workflow files in deployment order
WORKFLOWS=(
    "01-user-onboarding-workflow.json"
    "02-voice-session-management-workflow.json"
    "03-emergency-detection-response-workflow.json"
    "04-legal-document-generation-workflow.json"
    "05-payment-processing-subscription-workflow.json"
    "06-lawyer-escalation-workflow.json"
    "07-quality-monitoring-analytics-workflow.json"
)

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$status] $message" >> "$LOG_FILE"
}

# Function to show usage
show_usage() {
    cat << EOF
MISS Legal AI - N8N Workflow Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -d, --dry-run       Show what would be done without actually doing it
    -f, --force         Force deployment even if workflows exist
    -v, --verbose       Enable verbose output
    -k, --api-key       N8N API key (or set N8N_API_KEY environment variable)
    -H, --host          N8N host (default: n8n.odia.ltd)
    -p, --protocol      Protocol (default: https)

EXAMPLES:
    # Deploy all workflows
    $0 --api-key your_api_key

    # Dry run to see what would be deployed
    $0 --dry-run --verbose

    # Force deployment to different host
    $0 --force --host my-n8n.example.com --api-key your_key

ENVIRONMENT VARIABLES:
    N8N_HOST           N8N server hostname
    N8N_PROTOCOL       Protocol (http/https)
    N8N_API_KEY        N8N API authentication key
    N8N_PORT           N8N server port (optional)

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."

    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        print_status "ERROR" "curl is required but not installed"
        exit 1
    fi

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_status "ERROR" "jq is required but not installed"
        exit 1
    fi

    # Check if workflow files exist
    for workflow in "${WORKFLOWS[@]}"; do
        if [[ ! -f "$WORKFLOWS_DIR/$workflow" ]]; then
            print_status "ERROR" "Workflow file not found: $workflow"
            exit 1
        fi
    done

    # Check N8N API key
    if [[ -z "$N8N_API_KEY" ]]; then
        print_status "ERROR" "N8N API key is required. Set N8N_API_KEY environment variable or use --api-key option"
        exit 1
    fi

    print_status "SUCCESS" "All prerequisites met"
}

# Function to test N8N connection
test_n8n_connection() {
    print_status "INFO" "Testing N8N connection..."

    local n8n_url="${N8N_PROTOCOL}://${N8N_HOST}"
    if [[ -n "${N8N_PORT:-}" ]]; then
        n8n_url="${n8n_url}:${N8N_PORT}"
    fi

    local response
    if ! response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        "$n8n_url/api/v1/workflows" 2>/dev/null); then
        print_status "ERROR" "Failed to connect to N8N at $n8n_url"
        exit 1
    fi

    if [[ "$response" != "200" ]]; then
        print_status "ERROR" "N8N API returned status code: $response"
        print_status "ERROR" "Please check your N8N_API_KEY and N8N_HOST settings"
        exit 1
    fi

    print_status "SUCCESS" "N8N connection established"
}

# Function to check if workflow exists
workflow_exists() {
    local workflow_name=$1
    local n8n_url="${N8N_PROTOCOL}://${N8N_HOST}"
    if [[ -n "${N8N_PORT:-}" ]]; then
        n8n_url="${n8n_url}:${N8N_PORT}"
    fi

    local response
    response=$(curl -s \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        "$n8n_url/api/v1/workflows" 2>/dev/null)

    if echo "$response" | jq -r '.data[].name' | grep -q "^$workflow_name$"; then
        return 0  # Workflow exists
    else
        return 1  # Workflow doesn't exist
    fi
}

# Function to import workflow
import_workflow() {
    local workflow_file=$1
    local workflow_path="$WORKFLOWS_DIR/$workflow_file"

    print_status "INFO" "Processing workflow: $workflow_file"

    # Extract workflow name from JSON
    local workflow_name
    workflow_name=$(jq -r '.name' "$workflow_path")

    if [[ "$workflow_name" == "null" ]]; then
        print_status "ERROR" "Could not extract workflow name from $workflow_file"
        return 1
    fi

    print_status "INFO" "Workflow name: $workflow_name"

    # Check if workflow exists
    if workflow_exists "$workflow_name"; then
        if [[ "$FORCE" == false ]]; then
            print_status "WARNING" "Workflow '$workflow_name' already exists. Use --force to overwrite"
            return 0
        else
            print_status "INFO" "Workflow exists but --force specified, will overwrite"
        fi
    fi

    if [[ "$DRY_RUN" == true ]]; then
        print_status "INFO" "[DRY RUN] Would import workflow: $workflow_name"
        return 0
    fi

    # Import workflow
    local n8n_url="${N8N_PROTOCOL}://${N8N_HOST}"
    if [[ -n "${N8N_PORT:-}" ]]; then
        n8n_url="${n8n_url}:${N8N_PORT}"
    fi

    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$workflow_path" \
        "$n8n_url/api/v1/workflows/import" 2>/dev/null)

    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)

    if [[ "$http_code" == "201" ]] || [[ "$http_code" == "200" ]]; then
        print_status "SUCCESS" "Workflow '$workflow_name' imported successfully"
        
        # Extract workflow ID for activation
        local workflow_id
        workflow_id=$(echo "$response_body" | jq -r '.data.id // .id' 2>/dev/null)
        
        if [[ "$workflow_id" != "null" ]] && [[ -n "$workflow_id" ]]; then
            activate_workflow "$workflow_id" "$workflow_name"
        fi
    else
        print_status "ERROR" "Failed to import workflow '$workflow_name' (HTTP $http_code)"
        if [[ "$VERBOSE" == true ]]; then
            print_status "ERROR" "Response: $response_body"
        fi
        return 1
    fi
}

# Function to activate workflow
activate_workflow() {
    local workflow_id=$1
    local workflow_name=$2

    print_status "INFO" "Activating workflow: $workflow_name"

    if [[ "$DRY_RUN" == true ]]; then
        print_status "INFO" "[DRY RUN] Would activate workflow: $workflow_name"
        return 0
    fi

    local n8n_url="${N8N_PROTOCOL}://${N8N_HOST}"
    if [[ -n "${N8N_PORT:-}" ]]; then
        n8n_url="${n8n_url}:${N8N_PORT}"
    fi

    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" \
        -X PATCH \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"active": true}' \
        "$n8n_url/api/v1/workflows/$workflow_id" 2>/dev/null)

    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)

    if [[ "$http_code" == "200" ]]; then
        print_status "SUCCESS" "Workflow '$workflow_name' activated successfully"
    else
        print_status "WARNING" "Failed to activate workflow '$workflow_name' (HTTP $http_code)"
        if [[ "$VERBOSE" == true ]]; then
            print_status "WARNING" "Response: $response_body"
        fi
    fi
}

# Function to verify webhooks
verify_webhooks() {
    print_status "INFO" "Verifying webhook endpoints..."

    local webhooks=(
        "user-onboarding"
        "voice-session"
        "emergency-response"
        "document-generation"
        "payment-callback"
        "lawyer-escalation"
    )

    for webhook in "${webhooks[@]}"; do
        local webhook_url="${N8N_PROTOCOL}://${N8N_HOST}/webhook/$webhook"
        
        if [[ "$DRY_RUN" == true ]]; then
            print_status "INFO" "[DRY RUN] Would test webhook: $webhook_url"
            continue
        fi

        print_status "INFO" "Testing webhook: $webhook"
        
        local response
        local http_code
        response=$(curl -s -w "%{http_code}" -o /dev/null \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"test": true, "deployment_verification": true}' \
            "$webhook_url" 2>/dev/null || echo "000")

        if [[ "$response" =~ ^[2-4][0-9][0-9]$ ]]; then
            print_status "SUCCESS" "Webhook '$webhook' is responding (HTTP $response)"
        else
            print_status "WARNING" "Webhook '$webhook' not responding or not ready (HTTP $response)"
        fi
    done
}

# Function to show deployment summary
show_summary() {
    print_status "INFO" "Deployment Summary"
    echo "===================="
    echo "N8N Host: ${N8N_HOST}"
    echo "Protocol: ${N8N_PROTOCOL}"
    echo "Workflows: ${#WORKFLOWS[@]}"
    echo "Dry Run: $DRY_RUN"
    echo "Force: $FORCE"
    echo "Log File: $LOG_FILE"
    echo ""
    
    if [[ "$DRY_RUN" == false ]]; then
        print_status "INFO" "Deployment completed. Check the log file for details: $LOG_FILE"
        print_status "INFO" "Next steps:"
        echo "  1. Verify all workflows are active in N8N UI"
        echo "  2. Test webhook endpoints"
        echo "  3. Configure environment variables"
        echo "  4. Run integration tests"
        echo "  5. Monitor workflow executions"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -k|--api-key)
            N8N_API_KEY="$2"
            shift 2
            ;;
        -H|--host)
            N8N_HOST="$2"
            shift 2
            ;;
        -p|--protocol)
            N8N_PROTOCOL="$2"
            shift 2
            ;;
        *)
            print_status "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main deployment process
main() {
    print_status "INFO" "Starting MISS Legal AI N8N Workflow Deployment"
    print_status "INFO" "Timestamp: $(date)"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_status "INFO" "DRY RUN MODE - No actual changes will be made"
    fi

    # Initialize log file
    echo "MISS Legal AI N8N Workflow Deployment Log" > "$LOG_FILE"
    echo "Started: $(date)" >> "$LOG_FILE"
    echo "Host: $N8N_HOST" >> "$LOG_FILE"
    echo "Protocol: $N8N_PROTOCOL" >> "$LOG_FILE"
    echo "Dry Run: $DRY_RUN" >> "$LOG_FILE"
    echo "Force: $FORCE" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"

    # Run deployment steps
    check_prerequisites
    test_n8n_connection

    # Import workflows
    local success_count=0
    local total_count=${#WORKFLOWS[@]}

    for workflow in "${WORKFLOWS[@]}"; do
        if import_workflow "$workflow"; then
            ((success_count++))
        fi
    done

    # Verify webhooks
    verify_webhooks

    # Show summary
    show_summary

    print_status "INFO" "Deployment completed: $success_count/$total_count workflows processed successfully"

    if [[ $success_count -eq $total_count ]]; then
        print_status "SUCCESS" "All workflows deployed successfully!"
        exit 0
    else
        print_status "WARNING" "Some workflows failed to deploy. Check the log file for details."
        exit 1
    fi
}

# Run main function
main "$@"
