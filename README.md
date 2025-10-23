# 🧭 OpenShift Self-Service Platform

## Overview

Modern OpenShift environments often operate as **multi-tenant platforms**, where cluster-level access is restricted to maintain security and governance boundaries.  
In such setups, application teams typically **cannot create or modify cluster-level resources**, and must rely on the **platform team** for provisioning and configuration.

This project provides a **self-service system** that bridges this gap — empowering application teams to request, provision, and manage OpenShift resources within a governed, policy-driven framework.

---

## 🎯 Objectives

### 1. Self-Service for Application Teams
Enable application teams to request required Kubernetes and OpenShift resources through a unified web interface or API — without direct cluster-level permissions.

### 2. Automated, Policy-Driven Approvals
Routine, business-as-usual requests are automatically fulfilled using **policy-based workflows**, reducing manual intervention from platform or security teams.

### 3. GitOps-Driven Provisioning
Provisioning and configuration are executed via **GitOps pipelines using ArgoCD**, ensuring:
- Consistency across environments  
- Full traceability of changes  
- Auditable configuration history

---

## ⚙️ Supported Capabilities

| Capability | Description |
|-------------|--------------|
| **Namespace Uniqueness Enforcement** | Ensures global namespace uniqueness across all clusters and environments. |
| **Egress IP Allocation** | Automatically allocates and reserves egress IPs from cluster-level IP pools. |
| **RBAC Management** | Enables creation and management of project and cluster-level role bindings. |
| **GitOps Integration** | Provisions ArgoCD instances and associated Git repositories for environment synchronization. |
| **Vault Integration** | Automates secure integration of namespaces or applications with Vault for secret management. |

---

## 🧩 Architecture

The platform consists of two primary components:

### 🖥️ Frontend
- Built with **ReactJS** and **TailwindCSS**.  
- Provides an intuitive, modern user interface for requesting and managing OpenShift resources.  
- Uses REST APIs exposed by the FastAPI backend.  
- Designed for easy deployment on any web server (no Node.js runtime required).

### ⚙️ Backend
- Built with **FastAPI** — a high-performance Python web framework.  
- Implements REST APIs, resource validation, and business logic.  
- Integrates with **Casbin RBAC** for fine-grained, role-based access control.  
- Interfaces with OpenShift APIs and GitOps pipelines (via ArgoCD).

---

## 🚀 Key Benefits

- Reduces dependency on platform administrators  
- Enables faster, standardized onboarding of applications  
- Promotes GitOps best practices  
- Improves transparency, governance, and auditability  
- Provides centralized role-based access control via Casbin

---

## 🏗️ Tech Stack

| Layer | Technology |
|--------|-------------|
| Backend | [FastAPI](https://fastapi.tiangolo.com/) |
| Frontend | [ReactJS](https://react.dev/) |
| Styling | [TailwindCSS](https://tailwindcss.com/) |
| Authorization | [Casbin RBAC](https://casbin.org/) |

---

## 🔐 Example RBAC Enforcement (Casbin + FastAPI)

```python
from fastapi import FastAPI, HTTPException
import casbin

app = FastAPI()
enforcer = casbin.Enforcer("model.conf", "policy.csv")

@app.get("/apps")
def read_apps(user: str = "bob"):
    if not enforcer.enforce(user, "/apps", "GET"):
        raise HTTPException(status_code=403, detail="Access denied")
    return {"message": f"{user} is allowed to view apps"}
