# Automation Store

## Course Information

- Course Title: CSE-3200 Software Development V Lab
- Project Type: Full-stack web application
- Domain: Automation service marketplace
- Backend Technology: ASP.NET Core with C#

## Project Overview

Automation Store is a web-based platform designed to sell automation-focused digital services such as AI workflows, automation pipelines, scripts, and subscription-based solutions. The system supports customer browsing, cart management, voucher-based discounts, order placement, feedback collection, and admin-side operational control.

This project has been developed with strong emphasis on backend functionality, because the course evaluation gives higher weight to backend design, business logic, data management, and secure application flow.

## Project Objectives

- Build a structured full-stack software system using modern web technologies
- Design a backend that handles authentication, authorization, product management, order management, and feedback workflows
- Implement a database-driven commerce flow for automation service sales
- Provide separate user-facing and admin-facing modules
- Practice real-world software engineering concepts including API design, persistence, validation, role-based access control, and deployment readiness

## Core Features

### User Features

- User registration, login, logout, and identity-based session handling
- Product browsing with subscription-based plan selection
- Shopping cart management
- Voucher application during checkout
- Order placement and order history tracking
- Account page for profile and communication
- Feedback and contact message submission

### Admin Features

- Dashboard summary for platform activity
- Product creation, update, activation, and deletion
- Subscription plan management for each product
- Voucher creation and status control
- Order monitoring and payment status updates
- Feedback review and public posting control
- Separate handling of user feedback and contact messages

## Backend-Focused Highlights

The backend is the strongest part of this project and includes the following engineering areas:

- REST-style API controllers for authentication, user workflow, admin workflow, orders, products, vouchers, and feedback
- ASP.NET Core Identity integration for authentication and role-based authorization
- Entity Framework Core with PostgreSQL for persistence and schema management
- Business rules for subscription pricing, bundle discounts, and voucher validation
- Role separation between user and admin operations
- Session-based cart handling
- Email service integration for account-related communication
- Production-aware startup checks for database migration safety

## System Architecture

The application follows a client-server architecture:

- Frontend: React, TypeScript, Vite, Tailwind CSS, HeroUI
- Backend: ASP.NET Core MVC and Web API with C#
- Database: PostgreSQL with Entity Framework Core
- Authentication: ASP.NET Core Identity

The frontend consumes API endpoints exposed by the backend, while the backend performs validation, authorization, pricing logic, voucher checks, order creation, and database interaction.

## Main Backend Modules

- Authentication Module
  Handles user registration, login, logout, and current-user session retrieval.

- User Module
  Provides user-side endpoints for home data, products, cart, checkout, orders, and account details.

- Admin Module
  Manages products, subscription plans, vouchers, and dashboard metrics.

- Orders Module
  Supports admin order listing and payment status updates.

- Feedback Module
  Supports feedback submission, public review publishing, and separate admin-side message management.

- Data Access Layer
  Uses `ApplicationDbContext` and entity relationships for persistence and integrity.

## Database Design

The primary entities in the system are:

- ApplicationUser
- Product
- ProductSubscription
- Order
- Voucher
- Feedback

An ERD for the project is available in [ERD.md](/e:/vs%20code%20projects/linear_frontend/LinearAi_v1/ERD.md).

## Business Logic Implemented

- Product pricing with subscription duration support
- Discounted subscription plan calculation
- Bundle discount calculation based on cart size
- Voucher validation based on activity, expiry, usage limit, minimum order, and maximum discount cap
- Order creation with per-item discount distribution
- Payment status updates from admin panel
- Public review publishing limited to feedback items only

## Technology Stack

### Backend

- C#
- ASP.NET Core
- ASP.NET Core Identity
- Entity Framework Core
- PostgreSQL
- MailKit

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- HeroUI
- Axios
- Framer Motion

## Project Structure

- `Controllers/`
  MVC and API controllers

- `Data/`
  Database context and persistence configuration

- `Models/`
  Entity classes and view models

- `Services/`
  Email service abstraction and implementation

- `Migrations/`
  Entity Framework migration history

- `client/`
  React frontend application

- `wwwroot/`
  Static assets for the ASP.NET host

## Functional Flow Summary

1. A user creates an account or signs in.
2. The user browses automation products and chooses a subscription plan.
3. Selected items are added to the cart.
4. A voucher may be applied if it satisfies business rules.
5. The user completes checkout and orders are recorded in the database.
6. The admin monitors orders, products, vouchers, and feedback from the admin panel.

## Backend Evaluation Strengths

This project is especially suitable for backend-focused evaluation because it demonstrates:

- Multi-module API design
- Role-based authorization
- Identity-based authentication
- Entity relationship modeling
- Real business rule handling
- Database migration management
- Separation of admin and user concerns
- Production-oriented validation and startup behavior

## Deployment Readiness

The project has been prepared with deployment awareness in mind, including:

- database migration checking during startup
- build verification for frontend and backend
- production-safe API routing and fallback behavior
- structured configuration support for environment-specific settings

Sensitive credentials, SQL commands, and internal secret values should not be included in public documentation or shared repository notes.

## Notes

- This project is intended as a lab-based academic submission as well as a practical software engineering exercise.
- The backend has been designed to carry the major evaluation weight through architecture, business logic, and data handling.
- The frontend is included to provide a complete user experience, but the system is primarily strong from the backend perspective.

## Conclusion

Automation Store is a complete software development lab project that combines commerce flow, automation service delivery, role-based administration, and backend-centered engineering practices. It demonstrates how a structured C# backend can power a modern full-stack application with meaningful business rules and database-driven workflows.
