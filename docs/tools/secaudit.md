---
title: SecAudit
layout: default
parent: Tool Reference
nav_order: 10
---

# Secaudit Tool - Comprehensive Security Audit

**Systematic OWASP-based security assessment with compliance evaluation through workflow-driven investigation**

The `secaudit` tool provides comprehensive security auditing capabilities with systematic OWASP Top 10 assessment, compliance framework evaluation, and threat modeling. This workflow tool guides Claude through methodical security investigation steps with forced pauses between each step to ensure thorough vulnerability assessment, security pattern analysis, and compliance verification before providing expert analysis.

**Important**: AI models may not identify all security vulnerabilities. Always perform additional manual security reviews, penetration testing, and verification.

## Example Prompts

```
Perform a secaudit on this e-commerce web application focusing on payment processing security and PCI DSS compliance
```

```
Use bab's secaudit to conduct a comprehensive security audit of the authentication system, threat level high,
focus on enterprise security patterns and HIPAA compliance
```

**Pro Tip -- Multi-Scope Security Assessment:**
```
Start separate sub-tasks: in one run a secaudit for critical payment processing components focusing on PCI DSS,
and in the other for user management focusing on OWASP authentication vulnerabilities, then combine into a
unified security remediation plan using planner
```

## How It Works

The secaudit tool implements a **structured 6-step security workflow** that ensures comprehensive security assessment:

**Investigation Phase (Claude-Led):**
1. **Step 1**: Security Scope Analysis - Claude identifies application type, tech stack, attack surface, and compliance requirements
2. **Step 2**: Authentication & Authorization Assessment - Analyzes auth mechanisms, session management, and access controls
3. **Step 3**: Input Validation & Data Security - Reviews input handling, data protection, and injection vulnerabilities
4. **Step 4**: OWASP Top 10 (2021) Review - Systematic assessment of all OWASP categories with specific findings
5. **Step 5**: Dependencies & Infrastructure - Security analysis of third-party components and deployment configurations
6. **Step 6**: Compliance & Risk Assessment - Evaluation against specified compliance frameworks and risk prioritization

**Expert Analysis Phase:**
After Claude completes the investigation (unless confidence is **certain**):
- Complete security assessment summary with all vulnerabilities and evidence
- OWASP Top 10 systematic findings with severity classifications
- Compliance framework gap analysis and remediation recommendations
- Risk-prioritized remediation roadmap based on threat level and business impact

## Key Features

- **OWASP Top 10 (2021) systematic assessment** with specific vulnerability identification
- **Multi-compliance framework support**: SOC2, PCI DSS, HIPAA, GDPR, ISO 27001, NIST
- **Threat-level aware analysis**: Critical, high, medium, low threat classifications
- **5 audit focus areas**: OWASP, compliance, infrastructure, dependencies, comprehensive
- **Security scope context**: Define application type, tech stack, users, and data sensitivity
- **Severity filtering**: Filter findings by critical, high, medium, low, or all
- **Risk-based prioritization**: Business impact and exploitability assessment
- **Multi-file security analysis**: Cross-component vulnerability identification
- **Compliance gap analysis**: Specific framework requirements with remediation guidance
- **Attack surface mapping**: Entry points, data flows, and privilege boundaries
- **Image support**: Security analysis from architecture diagrams, network topology, or security findings

## Tool Parameters

**Workflow Investigation Parameters (used during step-by-step process):**
- `step` (string, required): Current security investigation step description
- `step_number` (number, required): Current step number in audit sequence
- `total_steps` (number, required): Estimated total investigation steps (typically 4-6, adjustable)
- `next_step_required` (boolean, required): Whether another investigation step is needed
- `findings` (string, required): Vulnerabilities and security analysis collected in this step
- `confidence` (enum, optional): Confidence level in assessment completeness -- `exploring`|`low`|`medium`|`high`|`very_high`|`almost_certain`|`certain`
- `continuation_id` (string, optional): Thread continuation ID for multi-turn conversations
- `files_checked` (string[], optional): All files examined during security investigation
- `relevant_files` (string[], optional): Files directly relevant to security assessment
- `relevant_context` (string[], optional): Methods/functions/classes central to security findings
- `issues_found` (object[], optional): Security issues identified -- each with `description` and `severity`
- `images` (string[], optional): Architecture diagrams, security documentation, or visual references

**Initial Security Configuration (used in step 1):**
- `audit_focus` (enum, optional): `owasp`|`compliance`|`infrastructure`|`dependencies`|`comprehensive` (default: `comprehensive`)
- `threat_level` (enum, optional): `low`|`medium`|`high`|`critical` (default: `medium`) -- determines assessment depth and urgency
- `security_scope` (string, optional): Application context including web/mobile/API/cloud, tech stack, users, and data sensitivity
- `compliance_requirements` (string[], optional): Compliance frameworks to assess against (e.g., `"SOC2"`, `"PCI DSS"`, `"HIPAA"`, `"GDPR"`, `"ISO 27001"`, `"NIST"`)
- `severity_filter` (enum, optional): `critical`|`high`|`medium`|`low`|`all` -- filter findings by severity
- `model` (string, optional): Model to use for expert analysis phase
- `temperature` (number, optional): Temperature for analytical consistency (0-1)
- `thinking_mode` (enum, optional): Thinking depth for analysis
- `use_assistant_model` (boolean, optional, default: true): Whether to use expert security analysis phase; set to false for Claude-only workflow

## Audit Focus Areas

**Comprehensive (default):**
- Full OWASP Top 10 assessment with all security domains
- Authentication, authorization, data protection, infrastructure
- Best for complete security posture evaluation

**OWASP:**
- Focused systematic OWASP Top 10 (2021) assessment
- Specific vulnerability identification against each category
- Best for standards-based security evaluation

**Compliance:**
- Evaluation against specified compliance frameworks
- Gap analysis with specific remediation recommendations
- Best for regulatory alignment and audit preparation

**Infrastructure:**
- Deployment security, configuration management, dependency security
- Network security, container security, cloud security posture
- Best for DevOps and infrastructure security assessment

**Dependencies:**
- Third-party component security analysis
- Known vulnerability scanning, supply chain risk assessment
- Best for dependency hygiene and supply chain security

## Threat Levels

Security assessment depth and urgency:

- **CRITICAL**: Mission-critical systems, high-value targets, regulatory requirements
- **HIGH**: Business-critical applications, customer data handling, financial systems
- **MEDIUM**: Standard business applications, internal tools, moderate risk exposure
- **LOW**: Development environments, non-sensitive applications, proof-of-concepts

## Compliance Frameworks

Supported compliance assessments:

- **SOC2**: Security, availability, processing integrity, confidentiality, privacy
- **PCI DSS**: Payment card industry data security standards
- **HIPAA**: Healthcare information privacy and security
- **GDPR**: General data protection regulation compliance
- **ISO 27001**: Information security management systems
- **NIST**: Cybersecurity framework controls

## OWASP Top 10 (2021) Coverage

Systematic assessment includes:

1. **A01 Broken Access Control**: Authorization flaws and privilege escalation
2. **A02 Cryptographic Failures**: Encryption and data protection issues
3. **A03 Injection**: SQL, NoSQL, OS, and LDAP injection vulnerabilities
4. **A04 Insecure Design**: Security design flaws and threat modeling gaps
5. **A05 Security Misconfiguration**: Configuration and hardening issues
6. **A06 Vulnerable Components**: Third-party and dependency vulnerabilities
7. **A07 Identification & Authentication Failures**: Authentication bypass and session management
8. **A08 Software & Data Integrity Failures**: Supply chain and integrity violations
9. **A09 Security Logging & Monitoring Failures**: Detection and response capabilities
10. **A10 Server-Side Request Forgery**: SSRF and related vulnerabilities

## Usage Examples

**Comprehensive E-commerce Security Audit:**
```
"Conduct a comprehensive secaudit for our Node.js e-commerce platform, threat level high,
compliance requirements PCI DSS and SOC2, focus on payment processing security"
```

**Authentication System Security Review:**
```
"Perform secaudit on authentication microservice, focus on owasp,
threat level critical, check for A07 and multi-factor authentication implementation"
```

**API Security Assessment:**
```
"Secaudit our REST API gateway, audit focus comprehensive,
compliance requirements GDPR, threat level medium"
```

**Infrastructure Security Review:**
```
"Perform secaudit on Kubernetes deployment manifests, focus infrastructure,
threat level high, include container security and network policies"
```

**Quick Security Scan:**
```
"Fast secaudit of user registration flow, focus owasp,
severity filter critical and high only"
```

## Best Practices

- **Define clear security scope**: Specify application type, tech stack, and security boundaries via `security_scope`
- **Set appropriate threat levels**: Match assessment depth to risk exposure and criticality
- **Include compliance requirements**: Specify relevant frameworks for regulatory alignment
- **Use parallel audits**: Run separate assessments for different components or compliance frameworks
- **Provide architectural context**: Include system diagrams, data flow documentation, or deployment topology
- **Focus audit scope**: Use `audit_focus` for targeted assessments of specific security domains
- **Filter by severity**: Use `severity_filter` to focus on the most critical findings first
- **Follow up on findings**: Use `continuation_id` to dive deeper into specific vulnerabilities

## When to Use Secaudit vs Other Tools

- **Use `secaudit`** for: Comprehensive security assessment, compliance evaluation, OWASP-based vulnerability analysis
- **Use `codereview`** for: General code quality with some security considerations
- **Use `precommit`** for: Pre-commit validation including basic security checks
- **Use `analyze`** for: Understanding security architecture without vulnerability assessment
