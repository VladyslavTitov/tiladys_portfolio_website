# TiLADYS BUSINESS CONTROL — MASTER PROMPT V2

Act as the principal software architect, senior Next.js/TypeScript engineer, Prisma/PostgreSQL database engineer, security engineer, German business-software specialist, financial-software engineer, UX designer, and QA engineer for my existing TiLADYS project.

Your job is to transform the existing TiLADYS control panel into a secure business-management system WITHOUT destroying or unnecessarily rewriting the existing public website, portfolio, prices, authentication, contact form, or existing database data.

This is an existing production project.

Do not start from zero.

---

# 1. EXISTING PROJECT

Repository:

`VladyslavTitov/tiladys_portfolio_website`

The current project is an npm-workspace monorepo.

Current structure:

```text
tiladys-platform/

apps/
    web/
        Public TiLADYS website

    control/
        Protected admin panel
        REST API
        authentication
        business logic

packages/
    db/
        Prisma
        PostgreSQL

    shared/
        shared Zod validation
        shared types/locales

```

Current technology includes:

```text
Next.js 16
React
TypeScript
Prisma
PostgreSQL / Neon
Zod
Argon2
Nodemailer
Lucide
Vercel deployment

```

The public website and control panel are separate deployments.

DO NOT casually combine them.

The existing separation provides an important security boundary.

---

# 2. CURRENT PUBLIC → ADMIN CONNECTION

The current public website uses:

```text
apps/web
        ↓
CONTROL_API_URL
        ↓
apps/control REST API
        ↓
Prisma
        ↓
PostgreSQL

```

Preserve this architecture unless there is a very strong documented reason to change it.

The public application must NEVER receive direct database credentials.

---

# 3. EXISTING PUBLIC CONNECTIONS TO PRESERVE

## Contact

Current workflow:

```text
Public Contact Form
        ↓
POST /api/public/contact
        ↓
apps/control
        ↓
ContactMessage
        ↓
Admin Messages

```

This workflow must be upgraded, not removed.

## Prices

Current workflow:

```text
Admin Prices
        ↓
PriceSection / PriceItem
        ↓
Public prices API
        ↓
Public TiLADYS website

```

KEEP the detailed existing Prices database/admin functionality intact.

Do not destroy or simplify the existing price catalogue.

## Portfolio

Current workflow:

```text
Admin Project
        ↓
Project / ProjectImage
        ↓
Public projects API
        ↓
TiLADYS Portfolio

```

Preserve this functionality.

Public portfolio projects and private customer projects must eventually be treated as different concepts.

---

# 4. OBJECTIVE

Transform the TiLADYS control panel into:

# TiLADYS Business Control

It should manage:

- customers
- companies
- customer communication
- services performed
- work history
- projects
- tasks
- work images
- documents
- receipts
- appointments
- calendar
- business planning
- invoices
- payments
- income
- expenses
- financial reporting
- tax-preparation reporting
- business statistics

while continuing to manage:

- portfolio
- public prices
- website inquiries

from the same protected control system.

---

# 5. DO NOT BUILD A SECOND DATABASE

There must be one canonical PostgreSQL database.

Do not create:

```text
CRM customer
Invoice customer
Planner customer
Message customer

```

as different records.

Instead create one canonical:

```text
Customer

```

and connect everything to it.

Example:

```text
CUSTOMER
│
├── Company
├── Contacts
├── Conversations
├── Messages
├── Projects
├── Service Jobs
├── Work Notes
├── Work Images
├── Tasks
├── Appointments
├── Documents
├── Quotes
├── Invoices
├── Payments
├── Income
├── Expenses
└── Activity History

```

---

# 6. NEW ADMIN NAVIGATION

Upgrade the existing admin navigation.

Target structure:

```text
TiLADYS CONTROL

Dashboard

CRM
    Customers
    Companies
    Leads
    Messages

Work
    Projects
    Service Jobs
    Tasks
    Files

Planner
    Calendar
    Appointments
    Tasks
    Availability

Finance
    Overview
    Income
    Expenses
    Quotes
    Invoices
    Payments
    Receipts

Reports
    Financial
    Tax Preparation
    Customers
    Projects
    Services
    Statistics

Website
    Portfolio
    Prices

Settings
    Business
    Invoice
    Tax
    Email
    Security

```

Do not remove the existing Portfolio, Prices or Messages functionality while building replacements.

Migration should be incremental.

---

# 7. DASHBOARD

Replace the very small current dashboard with a useful business dashboard.

Example:

```text
TODAY

Appointments
14:00  Laptop service — Müller
17:00  Website consultation — Schmidt GmbH

Tasks
5 open
2 overdue

CUSTOMERS
Total customers        24
New this month          3

WORK
Active projects         4
Open service jobs       3

FINANCE
Income this month       €2,450
Expenses this month       €720
Outstanding invoices     €680
Overdue invoices          €90

MESSAGES
New messages             4

NEXT APPOINTMENT
Today 14:00

```

Dashboard data must come from real database records.

---

# 8. CUSTOMER / CRM DATABASE

Create a proper `Customer` model.

Suggested fields:

```text
id
customerNumber

type:
PERSON
BUSINESS

firstName
lastName

companyId

email
phone
secondaryPhone

street
postalCode
city
country

preferredLanguage

status:
LEAD
ACTIVE
INACTIVE
ARCHIVED

source

notes

createdAt
updatedAt

```

Customer numbers should be human readable.

Example:

```text
C-2026-0001
C-2026-0002

```

Do not use the human customer number as the database primary key.

Use an internal immutable ID plus the display customer number.

---

# 9. COMPANY MODEL

Create separate companies.

Example:

```text
Company

Müller Elektrotechnik GmbH

Contacts:
Peter Müller
Anna Müller

```

A company may have multiple contacts.

A customer/contact may belong to a company.

Do not duplicate the company information into every invoice/project.

---

# 10. CUSTOMER PROFILE

The customer detail page should become one of the most important pages in the admin system.

Example tabs:

```text
Overview

Contact

Services / Work

Projects

Appointments

Messages

Invoices

Payments

Documents

Images

Notes

Activity

```

Top section:

```text
Peter Müller
Customer C-2026-0014

Müller Elektrotechnik

Phone
Email
Address

Total revenue
€1,340

Outstanding
€240

Last service
12 Sep 2026

Next appointment
25 Sep 2026

```

---

# 11. SERVICES / WORK PERFORMED

I need to store detailed information about every service I perform for a customer.

Create a model such as:

```text
ServiceJob

```

or:

```text
WorkOrder

```

Fields should include:

```text
id
jobNumber

customerId
companyId
projectId

serviceType
servicePriceItemId optional

title
description

privateNotes
customerVisibleNotes

serviceDate

status

estimatedPrice
finalPrice

materialCost
otherCost

startTime
endTime
workDuration

createdAt
updatedAt

```

Statuses:

```text
PLANNED
IN_PROGRESS
WAITING_CUSTOMER
COMPLETED
CANCELLED

```

Example:

```text
JOB-2026-0042

Customer:
Peter Müller

Service:
Laptop cleaning + Windows optimization

Date:
21 September 2026

Work performed:
- internal cleaning
- fan cleaned
- thermal paste replaced
- startup applications optimized
- Windows updates installed

Private note:
Battery health low. Customer informed.

Price:
€89

Materials:
€8

Images:
Before
After

Invoice:
INV-2026-0038

Payment:
PAID

```

---

# 12. WORK IMAGES

A ServiceJob must support images.

Categories:

```text
BEFORE
DURING
AFTER
DOCUMENT
OTHER

```

Each image should support:

```text
file
caption
category
createdAt
sortOrder

```

These images are PRIVATE by default.

Never accidentally expose customer work images through `/api/public`.

If I intentionally want to use a finished job as portfolio work, create a separate action:

```text
Create Portfolio Project

```

or link:

```text
ServiceJob
        ↓ optional
Portfolio Project

```

Public publication must require explicit approval.

---

# 13. FILE STORAGE

The existing portfolio currently stores ProjectImage binary data in PostgreSQL.

Do not immediately break or migrate this existing functionality.

However, customer documents, invoice PDFs, receipts, message attachments and large work-image collections should NOT automatically be stored as huge PostgreSQL `BYTEA` records.

Create a file-storage abstraction.

Store metadata in PostgreSQL:

```text
FileAsset

id
ownerType
ownerId

filename
originalFilename
mimeType
size
storageKey
checksum

visibility

createdAt
uploadedBy

```

Actual file content should use secure private object/file storage.

Possible future storage implementations:

```text
S3-compatible storage
Vercel Blob
Cloudflare R2
MinIO

```

Do not tightly couple the database model to one vendor.

Private files must not have predictable public URLs.

Generate authorized/temporary access URLs.

---

# 14. MESSAGES — MAJOR UPGRADE

The existing `ContactMessage` model only supports:

```text
original customer message
replyText
repliedAt

```

This is not enough.

Replace the concept gradually with:

```text
Conversation
ConversationMessage
MessageAttachment

```

Do not delete old ContactMessage records.

Create a migration path.

---

# 15. CONVERSATIONS

A conversation should connect:

```text
Conversation

customerId optional
companyId optional
originalContactMessageId optional

subject
status

createdAt
updatedAt

```

Statuses:

```text
OPEN
WAITING_CUSTOMER
WAITING_ADMIN
CLOSED
ARCHIVED
SPAM

```

---

# 16. CONVERSATION MESSAGES

Each thread can contain unlimited messages.

```text
ConversationMessage

id
conversationId

direction:
INBOUND
OUTBOUND
INTERNAL_NOTE

senderName
senderEmail

bodyText
bodyHtml optional

sentAt
deliveryStatus

createdByAdminId optional

```

Display messages like an actual business conversation:

```text
Peter Müller
10:31

Hello, I need help with my laptop.

────────────────────────

TiLADYS
10:46

Hello Peter,
yes, I can help...

attachment:
service-information.pdf

────────────────────────

Peter Müller
11:03

Thank you...

```

---

# 17. MESSAGE ATTACHMENTS

Allow the admin to send:

```text
PDF
JPG
PNG
WebP
DOCX where appropriate
other explicitly allowed business file formats

```

Every file must be validated.

Validate:

```text
extension
MIME type
magic/file signature where practical
size
authorization

```

Do not allow arbitrary executable files.

Initially set conservative limits.

Example:

```text
10 MB/file
5 attachments/message

```

Make these configuration values.

---

# 18. EMAIL INTEGRATION

Current application sends replies through Nodemailer/SMTP.

Preserve SMTP support.

Upgrade email service to support:

```text
subject
text
HTML
attachments
Reply-To
message identifiers

```

When I send a message from TiLADYS:

```text
Admin interface
    ↓
ConversationMessage saved
    ↓
SMTP email sent
    ↓
delivery state stored

```

Never mark a message as successfully sent before the SMTP provider confirms submission.

---

# 19. RECEIVING EMAIL REPLIES

Sending email and receiving email are different problems.

Do not pretend replies automatically appear inside TiLADYS unless inbound email has actually been implemented.

Design a provider-independent inbound adapter.

Possible future implementations:

```text
mail provider webhook

or

IMAP mailbox synchronization

```

Inbound customer replies should be matched to the existing conversation using safe message/thread identifiers.

Inbound attachments should pass through the same secure attachment pipeline.

---

# 20. PUBLIC CONTACT FORM → CRM

Upgrade the existing public contact flow.

Current:

```text
Contact form
→ ContactMessage

```

Target:

```text
Contact form
      ↓
ContactMessage / Conversation
      ↓
Match customer by verified information
      ↓
Customer or Lead
      ↓
Conversation

```

IMPORTANT:

Do not automatically merge two people only because names are similar.

Use carefully defined duplicate detection.

If uncertain:

```text
Possible duplicate

```

and require admin review.

---

# 21. PROJECTS

Create a PRIVATE business project model separate from the existing public Portfolio `Project` model.

Suggested name:

```text
ClientProject

```

Do not reuse the public Portfolio Project model for private CRM information.

ClientProject fields:

```text
id
projectNumber

customerId
companyId

title
description

status
priority

startDate
dueDate
completedDate

estimatedPrice
finalPrice

estimatedHours
actualHours

notes

createdAt
updatedAt

```

Statuses:

```text
PLANNED
ACTIVE
WAITING_CUSTOMER
PAUSED
COMPLETED
CANCELLED

```

---

# 22. CLIENT PROJECT ↔ PUBLIC PORTFOLIO

Allow an optional relationship:

```text
ClientProject
        ↓ explicit publish process
Portfolio Project

```

But NEVER automatically expose:

```text
customer name
customer email
customer address
financial information
private notes
private files
invoice data

```

to the public website.

---

# 23. TASKS

Create tasks that may belong to:

```text
Customer
Project
ServiceJob
Invoice
Appointment
or general business

```

Fields:

```text
title
description
status
priority

dueAt
completedAt

customerId optional
projectId optional
serviceJobId optional

reminderAt

```

Statuses:

```text
TODO
IN_PROGRESS
WAITING
DONE
CANCELLED

```

---

# 24. BUSINESS PLANNER

Create a proper calendar inside the TiLADYS control panel.

Views:

```text
Month
Week
Day
Agenda

```

Calendar contains:

```text
Customer appointments
Project deadlines
Service jobs
Tasks
Personal blocked time optional
Vacation
Business closed time

```

---

# 25. APPOINTMENTS

Create:

```text
Appointment

id

customerId optional
companyId optional
projectId optional
serviceJobId optional

title
description

startAt
endAt

locationType:
ONSITE
CUSTOMER_LOCATION
REMOTE
DROP_OFF
PICKUP
OTHER

location

status:
PLANNED
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW

reminderAt

```

Appointments should appear on:

```text
Planner
Customer profile
Project profile
Dashboard

```

---

# 26. CALENDAR PRIVACY

If personal unavailable blocks are eventually included:

```text
Personal appointment

```

should be able to appear to other future staff simply as:

```text
Unavailable

```

Do not expose private personal details unnecessarily.

---

# 27. FUTURE PUBLIC BOOKING

Design the planner so public booking can be added later.

Public site should only see:

```text
available appointment slots

```

Never expose the private calendar.

Future flow:

```text
TiLADYS website
    ↓
Choose service
    ↓
Available slot
    ↓
Booking request
    ↓
Customer/Lead
    ↓
Appointment

```

Do not implement public booking until core planner functionality is stable unless I explicitly request it.

---

# 28. BUSINESS SETTINGS

Create a central BusinessSettings area.

This will be the source of information used on invoices.

Fields may include:

```text
businessName
ownerLegalName

street
postalCode
city
country

businessEmail
businessPhone
website

taxNumber
vatId
businessId where relevant

bankName
IBAN
BIC optional

defaultCurrency
defaultPaymentTermDays

invoiceFooter
invoiceEmailText
invoiceLogo

```

DO NOT hard-code my business information into invoice components.

Store it securely/configurably.

---

# 29. TAX PROFILE

Do not assume that:

```text
Kleingewerbe

```

means:

```text
Kleinunternehmer

```

They are different concepts.

Create configurable tax profiles.

Example:

```text
TaxProfile

validFrom
validUntil

kleinunternehmer
vatRegistered

defaultVatRate
taxSettings

```

Invoice logic must use the tax configuration valid for the invoice date.

Never guess my tax status.

---

# 30. QUOTES / OFFERS

Create professional offers:

```text
Quote

quoteNumber
customer
issueDate
validUntil

lineItems

subtotal
tax
total

status

```

Statuses:

```text
DRAFT
SENT
ACCEPTED
DECLINED
EXPIRED
CANCELLED

```

Accepted quote may create/link:

```text
ClientProject
ServiceJob

```

---

# 31. INVOICES

Create professional invoice generation.

Workflow:

```text
DRAFT
    ↓
ISSUED
    ↓
SENT
    ↓
PARTIALLY_PAID
    ↓
PAID

```

also:

```text
OVERDUE
CORRECTED
CANCELLED

```

---

# 32. INVOICE NUMBERING

Invoice numbers must be unique.

Example:

```text
INV-2026-0001
INV-2026-0002

```

Never reuse an issued invoice number.

Use a safe database-backed numbering mechanism.

Do not determine the next invoice number simply by:

```text
count + 1

```

because concurrent requests can generate duplicates.

---

# 33. INVOICE CONTENT

Support the information required for German invoices, based on the currently applicable law and configured tax situation.

At minimum design for:

```text
Supplier legal name/address

Customer legal name/address

Tax number or VAT ID as applicable

Unique invoice number

Invoice date

Service/delivery date

Description of services/products

Quantity
Unit price

Net amounts

Applicable tax treatment

VAT rate and VAT amount where required

or legally appropriate exemption/Kleinunternehmer information

Gross amount

Payment terms

Bank/payment information

```

Before implementation verify current requirements against official German sources.

---

# 34. INVOICE LINE ITEMS

Do not store invoice totals only.

Use:

```text
Invoice
    ↓
InvoiceLineItem[]

```

Each line should support:

```text
description
quantity
unit
unitPrice
netAmount
taxRate/taxCode
taxAmount
grossAmount

```

Money must use exact decimal types.

NEVER JavaScript floating-point calculations for financial correctness.

Use Decimal / appropriate exact money calculations.

---

# 35. ISSUED INVOICE IMMUTABILITY

Draft invoices may be edited.

Once an invoice becomes:

```text
ISSUED

```

do not silently modify its historic financial values.

Corrections must use controlled workflows such as:

```text
Correction
Cancellation
Credit note
Replacement invoice

```

while preserving the original invoice.

Maintain an audit trail.

---

# 36. INVOICE PDF

Generate a professional TiLADYS-branded invoice PDF.

Invoice should include:

```text
TiLADYS branding
business information
customer information
invoice number
date
service date
line items
tax information
total
payment terms
bank details
legal/tax note where required

```

Store the generated invoice document.

Do not regenerate an old issued invoice using newly changed business settings and silently replace history.

The issued invoice needs a snapshot of the legal/business information used at issuance.

---

# 37. E-RECHNUNG READINESS

Design the invoice system for German structured electronic invoices.

Future/appropriate support:

```text
ZUGFeRD
XRechnung
EN 16931 compatible formats

```

Support both:

```text
Receive
Store
Read
Validate
Generate where legally/technically appropriate
Export

```

Preserve the original structured E-Rechnung file.

A rendered PDF is not a substitute for preserving the structured original.

Before implementation verify current BMF requirements and transition rules.

---

# 38. PAYMENTS

Create:

```text
Payment

id
invoiceId
customerId

date
amount

method:
BANK_TRANSFER
CASH
PAYPAL
CARD
OTHER

reference
notes

```

Support:

```text
full payment
partial payment
multiple payments
refund
overpayment

```

Invoice balance must be calculated from payment records.

---

# 39. INCOME

Income should not be manually disconnected from invoices.

Income may originate from:

```text
Invoice payment
Direct sale
Other income

```

Store the source relationship.

Example:

```text
Payment
    ↓
FinancialTransaction
    ↓
Income

```

Avoid entering the same €500 twice.

---

# 40. EXPENSES

Create expense management.

Fields:

```text
date

vendor
description

category

netAmount
taxAmount
grossAmount

paymentMethod

customerId optional
projectId optional
serviceJobId optional

receiptDocumentId

businessPurpose

notes

```

Categories should be editable.

Examples:

```text
Hosting
Domains
Software
Hardware
Tools
Advertising
Travel
Vehicle
Office
Phone
Education
Professional services
Bank fees
Other

```

---

# 41. RECEIPTS

Allow receipts/documents to be uploaded.

Mobile-friendly design should eventually allow:

```text
Take receipt photo
→ upload
→ create expense

```

OCR may be added later.

OCR must only SUGGEST:

```text
date
vendor
amount
VAT
category

```

Admin must verify before financial data becomes finalized.

---

# 42. FINANCE OVERVIEW

Finance page:

```text
THIS MONTH

Income
€3,200

Expenses
€870

Difference
€2,330

Outstanding invoices
€790

Overdue invoices
€180

Paid invoices
12

Expenses without receipt
3

```

Clearly distinguish:

```text
Revenue
Expenses
Cash flow
Outstanding amounts

```

Do not label every difference as accounting/tax “profit” unless the calculation definition justifies the term.

---

# 43. DOCUMENT MANAGEMENT

Create a Documents module.

Categories:

```text
CUSTOMER_FILE
CONTRACT
QUOTE
INVOICE
INCOMING_INVOICE
RECEIPT
PAYMENT_PROOF
TAX_DOCUMENT
WORK_IMAGE
MESSAGE_ATTACHMENT
OTHER

```

Documents can connect to:

```text
Customer
Company
Project
ServiceJob
Invoice
Expense
Conversation

```

---

# 44. REPORTS

Create professional report generation.

Reports should support:

```text
date range
customer
project
service
category
invoice status
payment status

```

Export formats:

```text
PDF
CSV
XLSX where appropriate

```

---

# 45. FINANCIAL REPORTS

Provide:

```text
Income report
Expense report
Cash-flow report
Invoice journal
Payment report
Outstanding invoice report
Overdue invoice report
Expense-category report
Revenue-by-service report
Revenue-by-customer report
Revenue-by-project report

```

---

# 46. TAX / ACCOUNTING PREPARATION REPORTS

Create a section:

```text
Reports
    → Tax & Accounting

```

Potential reports:

```text
Annual business summary

Income summary

Expense summary

Invoice journal

Incoming document/expense journal

Outgoing invoices

Open receivables

VAT-related summary where applicable

Revenue by tax treatment

Expense VAT summary where applicable

EÜR preparation report

Accountant export

Missing-document report

Tax-year archive package

```

IMPORTANT:

These should initially be called:

```text
Tax Preparation
Accounting Report
Accountant Export

```

Do not falsely advertise them as:

```text
official Finanzamt tax return
certified tax report
guaranteed GoBD-certified accounting

```

unless such claims are genuinely justified and legally reviewed.

---

# 47. GOBD-ORIENTED DESIGN

Financial records should be designed around:

```text
traceability
completeness
correctness
timely recording
order
change history
data availability
machine-readable export

```

Maintain audit trails.

Do not implement financial records as completely editable/deletable ordinary rows.

---

# 48. RETENTION POLICY

Create configurable document retention.

Different German business documents can have different statutory retention periods.

Do not hard-code one value for everything.

Store:

```text
documentType
retentionRule
retentionUntil
legalHold

```

Never automatically delete documents still subject to retention obligations.

---

# 49. STATISTICS

Create useful business statistics.

Dashboard/report examples:

```text
Revenue by month

Expenses by month

Revenue by customer

Revenue by service

Revenue by project

Average invoice value

Outstanding invoices

Number of new customers

Number of returning customers

Number of service jobs

Project completion

Appointment count

No-shows/cancellations

Work hours

Revenue per recorded work hour

```

---

# 50. CUSTOMER STATISTICS

Customer profile can show:

```text
Total billed
Total paid
Outstanding
Total service jobs
Total projects
Last service
First customer date
Average job value

```

---

# 51. PROJECT PROFITABILITY

For a project:

```text
Revenue       €1,000
Direct cost     €120
Work time        18h

```

Display useful metrics.

Do not call a calculation “net profit” unless all required expenses/taxes/costs are actually represented.

---

# 52. ACTIVITY HISTORY

Create a customer/business activity timeline.

Example:

```text
21 Sep
Appointment created

21 Sep
Service job completed

21 Sep
Invoice INV-2026-0042 issued

22 Sep
Message sent

24 Sep
Payment €89 received

```

This should make it possible to understand the complete customer history quickly.

---

# 53. SEARCH

Create global admin search.

Search:

```text
customer
company
email
phone
customer number

project
service job

invoice number

appointment

message

```

Results must respect authorization.

---

# 54. SECURITY — PRESERVE EXISTING GOOD FEATURES

The existing project already contains:

```text
Argon2 authentication
hashed session tokens
HttpOnly session cookie
SameSite Strict
login throttling
account lockout
origin validation
Zod validation
audit logs
rate limiting
security headers

```

DO NOT accidentally remove or weaken these features.

---

# 55. SECURITY — EXPAND FOR FINANCIAL DATA

Because the admin panel will now contain customer and financial records, strengthen security.

Add:

```text
role/permission foundation

sensitive-action reauthentication where appropriate

session management

audit events

download authorization

file access controls

backup monitoring

```

Potential future roles:

```text
OWNER
ACCOUNTANT
STAFF
READ_ONLY

```

Initially OWNER may be the only active role.

---

# 56. AUTHORIZATION

Every protected API endpoint must verify authentication and authorization SERVER SIDE.

Never rely on hiding buttons.

Example:

```text
/api/admin/invoices

```

must verify permission even if the invoice menu is hidden in the UI.

---

# 57. AUDIT LOGGING

Expand existing `AuditLog`.

Log important actions:

```text
CUSTOMER_CREATED
CUSTOMER_UPDATED

PROJECT_CREATED

SERVICE_JOB_COMPLETED

APPOINTMENT_CREATED

MESSAGE_SENT
MESSAGE_ATTACHMENT_DOWNLOADED

QUOTE_ISSUED

INVOICE_ISSUED
INVOICE_CORRECTED

PAYMENT_CREATED

EXPENSE_CREATED
EXPENSE_CORRECTED

REPORT_EXPORTED

DOCUMENT_UPLOADED
DOCUMENT_DOWNLOADED

SETTINGS_CHANGED

```

Never store passwords, full authentication tokens, or unnecessary confidential document content in audit metadata.

---

# 58. FILE SECURITY

For every uploaded file:

- authenticate where required
- authorize ownership/access
- enforce size limits
- enforce MIME allowlists
- inspect actual file signatures where practical
- randomize storage keys
- never execute uploaded content
- prevent path traversal
- prevent predictable public file URLs
- add malware scanning later where appropriate

---

# 59. PUBLIC API SECURITY BOUNDARY

Audit every route under:

```text
/api/public/*

```

Only intentionally public information may be returned.

NEVER expose through public APIs:

```text
Customer database
Addresses
Private emails
Private phone numbers
Private project notes
Invoices
Payments
Expenses
Receipts
Tax documents
Private work images
Internal messages
Appointments details

```

Public APIs should expose only the data needed by the public website.

---

# 60. GDPR

The system contains personal information.

Design for:

```text
data minimization
purpose limitation
access control
retention
export
correction
deletion/anonymization where legally allowed

```

Do not delete financial/tax records merely because a CRM record is deleted when legal retention obligations still apply.

Separate:

```text
CRM deletion/anonymization

```

from:

```text
legally retained financial documents

```

---

# 61. DATABASE MIGRATIONS

Use Prisma migrations.

Never manually modify production database structure and then leave Prisma unaware.

Workflow:

```text
schema change
↓
migration
↓
local test
↓
migration test against realistic database copy/safe staging
↓
backup
↓
production deployment
↓
verification

```

Preserve existing:

```text
AdminUser
Session
Project
ProjectImage
PriceSection
PriceItem
ContactMessage
VisitorDay
AuditLog

```

unless a carefully planned migration explicitly replaces/extends something.

---

# 62. DATA MIGRATION FOR CONTACT MESSAGES

Existing contact messages must survive.

Create migration such that historical:

```text
ContactMessage

```

can appear in the new conversation UI.

Possible strategy:

```text
ContactMessage
     ↓
Conversation

Original message
     ↓
ConversationMessage(INBOUND)

replyText if present
     ↓
ConversationMessage(OUTBOUND)

```

Do not lose historical inquiry data.

---

# 63. BACKUPS

Before major finance/CRM schema rollout, establish reliable backups.

Back up:

```text
PostgreSQL
uploaded documents
receipts
invoices
message attachments
work images
application configuration

```

Keep an off-system backup.

A backup strategy is not considered complete until restore has been tested.

---

# 64. INVOICE SNAPSHOTS

This is important.

An issued invoice must contain snapshots of information such as:

```text
business legal data
customer legal data
line items
tax configuration
payment details

```

Changing a customer's address next year must NOT modify the historic invoice from this year.

---

# 65. GERMAN LEGAL / TAX VERIFICATION

Before implementing compliance-sensitive functionality, verify the CURRENT law using authoritative German sources.

Priority sources:

```text
Gesetze im Internet

Bundesministerium der Finanzen

ELSTER

official tax administration sources

EUR-Lex when EU rules matter

```

Do not implement tax rules from AI memory alone.

Record important compliance decisions under:

```text
docs/compliance/

```

Example:

```text
docs/compliance/invoices.md
docs/compliance/e-rechnung.md
docs/compliance/retention.md
docs/compliance/gobd.md

```

Include:

```text
source
date checked
rule
implementation decision

```

---

# 66. DEPENDENCY AND LICENSE POLICY

TiLADYS is my business application.

Do not copy random GitHub code into the project.

Before adding a production dependency:

1. identify package and version
2. verify the upstream license
3. verify commercial compatibility
4. check maintenance/security state
5. explain why the package is required

Prefer permissive licenses such as:

```text
MIT
Apache-2.0
BSD
ISC

```

Do not add GPL/AGPL/SSPL/source-available dependencies to distributed components without explicit review.

Maintain:

```text
THIRD_PARTY_NOTICES.md

```

where appropriate.

---

# 67. MONEY CALCULATIONS

Never use ordinary floating point for financial calculations.

Bad:

```text
0.1 + 0.2

```

for financial truth.

Use Prisma Decimal / decimal-safe logic.

All totals should be calculated server-side.

Frontend calculations may preview amounts but cannot be authoritative.

---

# 68. DATE/TIME

Use:

```text
Europe/Berlin

```

as the business display timezone.

Store timestamps using timezone-safe practices.

Appointments must correctly handle daylight-saving changes.

---

# 69. RESPONSIVE ADMIN PANEL

The control panel must become fully usable on:

```text
Desktop
Laptop
Tablet
Mobile

```

Do not build desktop-only tables that become unusable on a phone.

Examples:

Desktop:

```text
full table
filters
side navigation
calendar week view

```

Mobile:

```text
cards
bottom/compact navigation where appropriate
day agenda
quick actions

```

Important mobile quick actions:

```text
+ Customer
+ Appointment
+ Expense
+ Receipt
+ Service Job
+ Payment

```

---

# 70. DESIGN

Preserve TiLADYS branding.

The admin panel should look like a professional modern business system, not a generic Bootstrap dashboard.

Prioritize:

```text
clarity
speed
readability
responsive design
consistent components
accessible forms
clear financial status colors/icons

```

Do not over-animate administrative screens.

---

# 71. DO NOT BUILD EVERYTHING IN ONE CHANGE

Implementation must be phased.

PHASE 0 — AUDIT & SAFETY

Before changing code:

- inspect current repository
- inspect all current Prisma models
- inspect migrations
- inspect current deployments
- inspect existing APIs
- inspect authentication/security
- inspect public website dependencies on control API
- run tests
- run typecheck
- run lint
- run build
- document baseline

Create a database backup before major migrations.

---

# 72. PHASE 1 — CRM FOUNDATION

Implement:

```text
Customer
Company
Customer profile
Notes
Customer activity
Search

```

Then verify existing website remains functional.

---

# 73. PHASE 2 — WORK MANAGEMENT

Implement:

```text
ClientProject
ServiceJob
Tasks
Work images
Documents

```

Do not touch public Portfolio Project unnecessarily.

---

# 74. PHASE 3 — MESSAGING

Implement:

```text
Conversation
ConversationMessage
MessageAttachment

SMTP replies
attachment sending
message history
ContactMessage migration

```

Then optionally implement inbound email synchronization separately.

---

# 75. PHASE 4 — PLANNER

Implement:

```text
Calendar
Appointments
Tasks
Deadlines
Availability
Reminders

```

---

# 76. PHASE 5 — FINANCE FOUNDATION

Implement:

```text
BusinessSettings
TaxProfile

Income
Expenses
FinancialTransaction
Receipt/Documents

```

---

# 77. PHASE 6 — QUOTES & INVOICES

Implement:

```text
Quote
QuoteLineItem

Invoice
InvoiceLineItem

Payment

Invoice PDF
Invoice numbering
Invoice snapshots
Correction workflow

```

---

# 78. PHASE 7 — REPORTS

Implement:

```text
Finance reports
Customer reports
Project reports
Service reports
Tax preparation reports
Statistics
PDF/CSV/XLSX exports

```

---

# 79. PHASE 8 — E-RECHNUNG

After current-law verification implement:

```text
E-Rechnung reception
structured file storage
viewer
validation
ZUGFeRD/XRechnung support
generation where appropriate

```

---

# 80. PHASE 9 — PUBLIC WEBSITE INTEGRATION

After CRM/planner is stable evaluate:

```text
public customer booking
contact → CRM automation
selected customer portal functionality

```

Do not expose private admin APIs.

---

# 81. TESTS

Every major module needs tests.

At minimum:

```text
Customer CRUD

Authorization

Public/private API separation

Conversation creation

Attachment validation

Invoice numbering

Invoice calculations

VAT calculations

Kleinunternehmer behavior where configured

Partial payment

Invoice balance

Expense calculations

Report totals

Date filters

Appointment conflicts

Financial immutability

Database migrations

Existing Portfolio

Existing Prices

Existing Contact Form

```

Regression tests are required for existing public functionality.

---

# 82. DEVELOPMENT RULE

When I give you this master prompt:

DO NOT immediately rewrite the repository.

First inspect the CURRENT branch.

Then give me:

```text
1. Current architecture analysis
2. Existing features we can reuse
3. Existing problems/limitations
4. Proposed database additions
5. Proposed route/API additions
6. Proposed admin navigation
7. Migration risks
8. Security risks
9. Implementation phases
10. Exact Phase 1 plan

```

Only after understanding the current code should implementation begin.

---

# 83. WHEN IMPLEMENTING

For every feature determine:

```text
Which module owns it?

Which Prisma models are required?

Does it modify existing data?

Does it require migration?

Could it break the public website?

Which API routes are public?

Which are admin-only?

What authorization is required?

What needs audit logging?

Does it contain personal information?

Does it contain financial information?

Does it need immutable history?

Does it need file storage?

What tests are required?

What dependencies are required?

What licenses do those dependencies use?

```

---

# 84. IMPORTANT PROHIBITIONS

Do NOT:

- replace the existing TiLADYS site with a new generic project
- delete existing prices
- delete portfolio data
- delete ContactMessages
- reset/seed over production business data
- expose Prisma/database credentials publicly
- expose CRM APIs to the public site
- store financial values using floating point
- make issued invoices freely editable
- use `count + 1` invoice numbering
- make private work images public automatically
- expose receipts/documents using permanent public URLs
- silently change historical invoices
- claim reports are officially Finanzamt-certified without proof
- hard-code my tax status
- assume Kleingewerbe means Kleinunternehmer
- weaken existing authentication/security
- add unreviewed dependencies
- make a giant migration without backup/recovery planning

---

# 85. FINAL TARGET

The finished TiLADYS architecture should look approximately like this:

```text
                         PUBLIC INTERNET
                               │
                               ▼
                        apps/web
                     TiLADYS Website
                               │
          ┌────────────────────┼───────────────────┐
          │                    │                   │
       Prices              Portfolio            Contact
          │                    │                   │
          └────────────────────┼───────────────────┘
                               │
                     PUBLIC CONTROL APIs
                               │
                               ▼
                    apps/control
                TiLADYS Business Control
                               │
    ┌──────────────┬───────────┼───────────┬──────────────┐
    │              │           │           │              │
   CRM           Work       Planner      Finance       Website
    │              │           │           │              │
Customers       Projects    Calendar    Invoices      Portfolio
Companies       Services    Appts       Payments      Prices
Messages        Tasks       Reminders    Expenses
Documents       Images                   Reports
    │              │           │           │
    └──────────────┴───────────┼───────────┘
                               │
                         Prisma Layer
                               │
                               ▼
                          PostgreSQL
                               │
                    Private file storage

```

The most important principle:

**The public TiLADYS website remains a public presentation and customer-acquisition website.**

**The TiLADYS control application becomes the private operating system for my business.**

The two systems stay connected through carefully controlled APIs, while private customer, accounting, planning and document information never becomes publicly accessible.

Build this incrementally, securely, without losing my existing data or breaking the working TiLADYS website.

---

# 86. ADDITIONAL SCOPE — PUBLIC PORTFOLIO, GOOGLE SEO AND CONTROL LOGIN

This addendum extends the requirements in sections 1–85. Those sections remain binding, especially the existing monorepo architecture, data-preservation, security, phased implementation, and private-file rules. This project includes both the public site and the protected admin application; do not replace either with a new generic app.

## 86.1 Audit and implementation order

During Phase 0, audit both apps and their shared data flow. Specifically map:

- all uses of the current featured-project flag in the Prisma model, migrations, validation schemas, admin UI, API, public API, portfolio page, and tests
- public portfolio list/detail routes, localized content, existing SEO metadata, sitemap and robots handling
- current service-page routes, their localized content, existing business contact/location data, and structured data
- the control-panel login page, logo asset, navigation styling, and authentication flow
- the public website to control API boundary

After the read-only audit and baseline report, add these public-site tasks as the first bounded implementation phase, followed by the existing CRM/business-control phases. Keep each database change isolated and documented. Do not deploy, commit, access production data, or apply migrations to production.

## 86.2 Portfolio featured-project behavior

Remove the featured-project selection feature from the backend and admin interface. Remove its editor control, API input/output, shared validation/type fields, and Prisma model field after confirming every dependency. Create the required Prisma migration; it may remove only the obsolete featured flag and must preserve every project, project image, translation, status, slug, and other project data. Never reset or reseed the production database.

The public Featured Project panel must rotate through all published portfolio projects. Keep the existing 15-second rotation and accessible previous, next, and pause controls. A published project may appear in the Featured Project panel and also remain visible in the regular portfolio grid at the same time. Do not exclude projects from the grid because they are currently shown in the featured panel.

Draft and archived projects must never be exposed in the carousel, grid, detail routes, sitemap, or public API. Use localized project content for each locale. Respect the existing project order where appropriate. Support keyboard operation, reduced-motion preferences, and a sensible static state when there are too few published projects to rotate.

## 86.3 Project-specific search and sharing settings

Make each public project detail page independently discoverable and shareable. Add appropriate localized project SEO settings to the admin editor, reusing existing fields where possible:

- optional SEO title and meta description for each supported locale
- optional social-sharing title and description, with a sensible fallback to the SEO/project title and summary
- optional social preview image chosen from that project’s already-public images, defaulting to its approved cover image
- an indexing control only if the existing publishing model cannot express the need; published projects should be indexable by default, while drafts and archived projects must always be noindex

Generate canonical URLs from the actual localized public route. Generate accurate alternate-language links for routes that exist. Do not add a free-form canonical URL field that could point to the wrong page. If published slugs can be edited, preserve old URLs with redirects. Do not publish private CRM/customer-project information or private work images as SEO content.

Use server-rendered metadata for every published project route: unique localized title and description, canonical URL, language alternates, Open Graph and social-card metadata, and an appropriate social image. Ensure the actual page has useful, project-specific headings and text so search engines and visitors can understand the work. Do not rely on meta keywords or keyword stuffing.

The Windows 11 and Fedora dual-boot project must use a clear, natural project title and content that can match searches for “Windows 11 and Fedora dual boot setup” and related wording, only to the extent that this accurately describes the published project.

Include every eligible published project and its valid localized routes in the sitemap. Exclude drafts and archived projects. Verify robots directives, canonical URLs, alternate-language links, and generated page metadata. Do not promise Google ranking or instant indexing; provide the owner with the sitemap URL and practical Google Search Console submission/indexing instructions without logging into or changing an external account.

## 86.4 SEO for service pages and NRW PC support

Give every real public service page unique, localized SEO metadata and useful page content. Cover the actual services already offered, including website creation/web development, PC and laptop cleaning, setup, upgrades, software support, and related digital support. Use accurate existing business information and pricing; do not invent services, guarantees, credentials, prices, testimonials, or customer results.

For PC and laptop services, localize the service area to North Rhine-Westphalia (NRW), including Mülheim an der Ruhr, Düsseldorf, Dortmund, Duisburg, Oberhausen, Wuppertal, Essen, and other NRW cities where the service is genuinely available. Do not advertise this PC/laptop service as nationwide or outside NRW. Keep this geographic limit scoped to PC/laptop services; do not incorrectly restrict other services that can be provided remotely.

Use one useful NRW service-area page or the existing regional service structure. Do not create thin, near-duplicate doorway pages for every city, claim a TiLADYS office in cities where none exists, or add fake addresses. Use the confirmed business location and contact details already present in the project consistently. Add accurate structured data for the business and services only where appropriate, including the real location and service area; never mark the listed cities as separate business locations.

For each localized service route, implement a distinct title, meta description, canonical URL, valid language alternates, social metadata, meaningful H1/content, and appropriate structured data. Include the service pages in the sitemap and ensure they are not unintentionally blocked from indexing.

## 86.5 Brand and founder search visibility

Use the canonical brand spelling “TiLADYS” consistently in the site title, logo alt text, metadata and structured data. Ensure the site’s content clearly identifies TiLADYS as the business founded and operated by Vladyslav Titov, using the already approved About-page facts. Support natural brand searches such as “TiLADYS”, “Tiladys”, “TiLADYS IT services”, and “Vladyslav Titov” without repetitive keyword stuffing.

Use accurate organization/local-business and founder structured data where appropriate. Keep the business name, confirmed public address, phone, email, logo, website URL, and verified social links consistent with the current site. Use only social URLs already configured and verified in the repository. Do not invent reviews, ratings, business branches, or legal-entity claims.

Ensure the site has correct localized HTML lang values, page-specific titles/descriptions, canonical and language alternate links, crawlable internal links, a correct sitemap, and appropriate robots directives. Validate structured data syntax and keep it consistent with visible page content. Explain that technical SEO improves crawlability and relevance but cannot guarantee a position or result in Google.

## 86.6 Control-panel login design

Improve the existing control-panel login page using the TiLADYS brand: deep navy, restrained cyan, clear contrast, generous spacing, and a professional responsive layout. The current screenshot shows the TiLADYS logo very faint inside the white login card. Reposition the existing logo so it is clearly visible against the navy/nav background, such as above or overlapping the login card on the navy area; do not leave a pale logo on a pale card or redraw the logo.

Preserve the current email, password, and secret-phrase login requirements and all authentication behavior. Keep the existing Argon2id verification, session protections, throttling/lockout, origin checks, audit logging, and server-side validation unchanged. Do not hard-code or prefill credentials, expose secrets, or weaken the sign-in flow. Make the page keyboard accessible and usable on phones.

## 86.7 Existing business-control scope and separation

All CRM, companies, customer profiles, service jobs, private images/files, conversations and attachments, tasks, planner/calendar, invoices, payments, income/expenses, reports, tax-preparation, and business settings described earlier in this prompt remain in scope and must be implemented incrementally.

Keep private ClientProject records separate from public portfolio Project records. The portfolio remains a public showcase of explicitly published work. Removing the portfolio featured flag must not remove or replace the public Project model, project editor, image management, publication workflow, or the separate private ClientProject model.

## 86.8 Acceptance criteria for this addendum

Before reporting completion, verify:

1. The featured flag and its control are removed from admin/backend code and the migration is isolated; existing project records and media are preserved.
2. Every published project can rotate through the public featured panel and also remains in the normal project grid; drafts and archived projects remain private.
3. Every published project detail route has its own correct localized metadata and valid canonical/alternate URLs.
4. Published project routes and service routes appear in the sitemap; drafts and archived routes do not.
5. PC/laptop service content and structured data identify NRW as its service area, including the cities listed above, without implying offices there or nationwide service.
6. Brand and founder metadata use verified TiLADYS information and do not contain fabricated claims.
7. The redesigned login logo is clearly visible on the navy area and all existing authentication/security behavior still works.
8. The existing public website, prices, project publishing, admin authentication, messages and database records continue to work.

Run the existing relevant lint, typecheck, build, unit/integration and browser checks. Add focused regression coverage for the new carousel visibility rules, SEO generation, sitemap inclusion/exclusion, and the featured-flag migration where the current test setup supports it. Test representative localized desktop and mobile pages. Report changed files, migration implications, checks run, any remaining manual Google Search Console steps, and any unresolved limitation. Do not claim the site has been indexed or ranked unless that has been independently verified.
