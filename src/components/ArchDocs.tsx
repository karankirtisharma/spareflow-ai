import React, { useState } from "react";
import { 
  Database, ShieldCheck, GitFork, Network, KeyRound, ServerCrash, 
  MapPin, Users, ListFilter, ClipboardCheck, ArrowUpRight, Terminal
} from "lucide-react";

export function ArchDocs() {
  const [activeTab, setActiveTab] = useState("architecture");

  const tabs = [
    { id: "architecture", label: "1. High Level Arch", icon: Network },
    { id: "er", label: "2. Database ERD", icon: Database },
    { id: "folders", label: "3. Folder Structure", icon: GitFork },
    { id: "sqlalchemy", label: "4. SQLAlchemy 2.0", icon: Terminal },
    { id: "alembic", label: "5. Alembic Plan", icon: ClipboardCheck },
    { id: "schemas", label: "6. Pydantic Schemas", icon: ListFilter },
    { id: "services", label: "7. Services & Repos", icon: ShieldCheck },
    { id: "jwt", label: "8. JWT & RBAC Spec", icon: KeyRound },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <h2 className="font-sans font-semibold text-lg text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Spareflow AI: Phase 1 Enterprise Design Deliverables
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Detailed technical specifications, diagrams, and compliance checklists designed for multi-tenant isolation.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/50 p-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase felt-slate-400">
                1. High-Level Modular Monolith Clean Architecture
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Combining <strong>Domain-Driven Design (DDD)</strong> structures with Strict Multi-Tenant Separation layers.
              </p>
            </div>

            {/* ASCII flow chart */}
            <div className="bg-slate-950 text-emerald-400 p-5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-800 max-h-96">
{` [Client Layer]  -->  (Vite / Next.js SPA View Controller & HTTP Client Engine)
                               |
                               | (JWT Bearer Token on Authorization Headers)
                               v
 [API Controllers] --> (Express / FastAPI Route Controllers)
                               |
                               | (Authentication & RBAC Route Guard Middleware)
                               v
 [Middlewares]    --> (Tenant Extraction & Request Scope Verification)
                               |
                               v
 [Service Layer]  --> (AuthService, TenantService, UserService, BranchService)
                               |
                               | (DDD Orchestrated Domain Logic)
                               v
 [Repository]     --> (ITenantRepo, IBranchRepo, IUserRepository)
                               |
                               | (Automated Tenant Scope Injections)
                               v
 [Data Storage]   --> (PostgreSQL Relational DB / Persistent Engine)`}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-indigo-50/40 border border-indigo-100">
                <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" /> Core Isolation Principle
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Every transaction from the Controller down relies on the <strong>tenant_id</strong> injected through user token claims. No raw, unscoped CRUD queries are allowed on branches, users, or future database models.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-100">
                <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Context Segregation
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  The Auth module governs tenant and user creation (Business Registration), whereas User Management controls branches and member roles. Boundaries are clean, encapsulated, and loosely coupled.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "er" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                2. Relational Database ER Diagram (SaaS Design)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                A highly secure database foundation which enforces <strong>Tenant Ownership</strong> across all branches and users.
              </p>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
{` +----------------------------------------------------------------------------------+
 |                                    TENANTS REGISTRY                              |
 +----------------------------------------------------------------------------------+
 |  PK  | tenant_id       | VARCHAR(64)  | Primary Tenant Business Key identifier   |
 |      | business_name   | VARCHAR(255) | Full Business Legal Name                 |
 |      | business_type   | VARCHAR(100) | Retail / Wholesaling Sparepart Segment   |
 |      | plan            | VARCHAR(50)  | growth / enterprise / free tier          |
 |      | is_active       | BOOLEAN      | Operational status                       |
 |      | created_at      | TIMESTAMP    | DateTime record initiated                |
 |      | updated_at      | TIMESTAMP    | DateTime last detail modified            |
 +-------------+--------------------------------------------------------------------+
               |
               | (1 : many relationship)
               +----------------------------------+
               |                                  |
               v                                  v
 +-----------------------------+    +-----------------------------+
 |          BRANCHES           |    |            USERS            |
 +-----------------------------+    +-----------------------------+
 |  PK  | branch_id    | VC(64)|    |  PK  | user_id      | VC(64)|
 |  FK  | tenant_id    | VC(64)|<---+  FK  | tenant_id    | VC(64)|
 |      | branch_name  | VC(255|    |  FK  | branch_id    | VC(64)|<---+ (Assigned Branch)
 |      | location     | TEXT  |    |      | full_name    | VC(255|    |
 |      | phone        | VC(30)|    |      | email        | VC(150|    | (Unique Index)
 |      | email        | VC(150|    |      | phone        | VC(30)|    |
 |      | created_at   | TS    |    |      | password_hash| TEXT  |    |
 +-------------+---------------+    |      | role         | Role  |----+ (Owner, Manager, Staff)
               |                    |      | is_active    | BOOLEAN|
               | (1 : many users)   |      | last_login   | TS     |
               +--------------------+      | created_at   | TS     |
                                    |      | updated_at   | TS     |
                                    +-----------------------------+`}
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 uppercase tracking-wide">
                ⚠️ Critical Referential Constraint
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                A <strong>User</strong> assigned to a branch (Manager/Staff role) must reside inside the same <strong>Tenant</strong> as that branch. Cross-tenant user-branch assignments are strictly prevented at the validation/service level.
              </p>
            </div>
          </div>
        )}

        {activeTab === "folders" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                3. Enterprise Folder Structure
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Designed to transition from a single-process <strong>Modular Monolith</strong> into dynamic Microservices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 text-slate-300 p-5 rounded-lg font-mono text-xs overflow-y-auto max-h-[400px] border border-slate-800">
{`backend/
├── alembic.ini
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth/
│   │   │   │   ├── router.py
│   │   │   │   └── dependencies.py
│   │   │   ├── users/
│   │   │   │   ├── router.py
│   │   │   │   └── dependencies.py
│   │   │   └── branches/
│   │   │       ├── router.py
│   │   │       └── dependencies.py
│   │   └── endpoints.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── database/
│   │   ├── base.py
│   │   ├── models/
│   │   │   ├── tenant.py
│   │   │   ├── branch.py
│   │   │   └── user.py
│   │   └── repositories/
│   │       ├── tenant.repository.py
│   │       ├── branch.repository.py
│   │       └── user.repository.py
│   ├── services/
│   │   ├── auth.service.py
│   │   ├── branch.service.py
│   │   └── user.service.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── branch.py
│   │   └── user.py
│   └── middleware/
│       ├── rbac.py
│       └── rate_limiter.py
└── tests/
    ├── conftest.py
    ├── test_auth.py
    └── test_rbac.py`}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase">Folder Segregation logic</h4>
                  <ul className="text-xs text-slate-600 list-disc ml-5 mt-2 space-y-1.5 leading-relaxed">
                    <li><strong>app/api/v1/:</strong> Manages HTTP layer endpoints and parses query/payload parameters.</li>
                    <li><strong>app/core/:</strong> Centralized cryptos, password parsers, and JWT generation config values.</li>
                    <li><strong>app/database/:</strong> Implements the SQLAlchemy session lifecycle and raw database connections.</li>
                    <li><strong>app/database/repositories/:</strong> Implements DB-specific query logic (hides raw SQL details from system features).</li>
                    <li><strong>app/services/:</strong> Houses standard Domain & Business rules (orchestrates Repositories).</li>
                    <li><strong>app/schemas/:</strong> Holds Pydantic v2 schemas for high-speed serialization & deserialization.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sqlalchemy" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                4. Production FastAPI SQLAlchemy 2.0 Models
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Zero-placeholder Python classes utilizing <strong>SQLAlchemy 2.0 Mapped/mapped_column</strong>.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-300 p-5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre max-h-96 border border-slate-800">
{`from datetime import datetime
from typing import List, Optional
from enum import Enum as PythonEnum
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class UserRole(str, PythonEnum):
    OWNER = "Owner"
    MANAGER = "Manager"
    STAFF = "Staff"

class Tenant(Base):
    __tablename__ = "tenants"

    tenant_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False)
    plan: Mapped[str] = mapped_column(String(50), default="growth")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branches: Mapped[List["Branch"]] = relationship("Branch", back_populates="tenant", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship("User", back_populates="tenant", cascade="all, delete-orphan")


class Branch(Base):
    __tablename__ = "branches"

    branch_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    branch_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=True)
    email: Mapped[str] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="branches")
    users: Mapped[List["User"]] = relationship("User", back_populates="branch")


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    branch_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("branches.branch_id", ondelete="SET NULL"), nullable=True)
    
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STAFF, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="users")`}
            </div>
          </div>
        )}

        {activeTab === "alembic" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                5. Alembic Database Migration Plan
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Zero-downtime database deployment playbook to roll out Phase 1 relational foundation schemas.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase">Migration Sequencing</h4>
                <ol className="list-decimal ml-5 mt-2 text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li>
                    <strong>Initialize Alembic Workspace Environment:</strong>
                    <br />
                    <code>$ alembic init alembic</code>
                  </li>
                  <li>
                    <strong>Bootstrap Database Connection URL context in env.py:</strong>
                    <br />
                    Inject environment-backed connection: <code>sqlalchemy.url = os.getenv("DATABASE_URL")</code>
                  </li>
                  <li>
                    <strong>Generate Migration Script:</strong>
                    <br />
                    <code>$ alembic revision --autogenerate -m "create_initial_tenant_user_branch_tables"</code>
                  </li>
                  <li>
                    <strong>Inspect the generated migration script (Upgrade and Downgrade blocks):</strong> Verify correct constraint settings and unique index.
                  </li>
                  <li>
                    <strong>Execute Migration Targets:</strong>
                    <br />
                    <code>$ alembic upgrade head</code>
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase">Execution Code Block Example</h4>
                <pre className="bg-slate-950 text-slate-300 p-3 rounded mt-2 font-mono text-[10px] overflow-x-auto">
{`def upgrade() -> None:
    # 1. Create Tenants Table
    op.create_table(
        'tenants',
        sa.Column('tenant_id', sa.String(length=64), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=False),
        sa.Column('business_type', sa.String(length=100), nullable=False),
        sa.Column('plan', sa.String(length=50), nullable=False, server_default='growth'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('tenant_id')
    )
    # 2. Create Branches Table
    op.create_table(
        'branches',
        sa.Column('branch_id', sa.String(length=64), nullable=False),
        sa.Column('tenant_id', sa.String(length=64), nullable=False),
        sa.Column('branch_name', sa.String(length=255), nullable=False),
        sa.Column('location', sa.Text(), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('email', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.tenant_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('branch_id')
    )
    # 3. Create Users Table
    op.create_table(
        'users',
        sa.Column('user_id', sa.String(length=64), nullable=False),
        sa.Column('tenant_id', sa.String(length=64), nullable=False),
        sa.Column('branch_id', sa.String(length=64), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('OWNER', 'MANAGER', 'STAFF', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.branch_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.tenant_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schemas" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                6. Production Pydantic v2 Schemas
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Robust input structures validating emails, passwords, and sanitizing outputs to avoid exposing password hashes.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-300 p-5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre max-h-96 border border-slate-800">
{`from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    OWNER = "Owner"
    MANAGER = "Manager"
    STAFF = "Staff"

class RegisterBusinessRequest(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255)
    business_type: str = Field(..., max_length=100)
    plan: str = Field("growth")
    owner_name: str = Field(..., min_length=2, max_length=255)
    owner_email: EmailStr
    owner_phone: str = Field(..., max_length=30)
    owner_password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class BranchBase(BaseModel):
    branch_name: str = Field(..., min_length=2, max_length=255)
    location: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class BranchCreate(BranchBase):
    pass

class BranchResponse(BranchBase):
    branch_id: str
    tenant_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: UserRole
    branch_id: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    tenant_id: str
    branch_id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str] = null
    role: UserRole
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserResponse`}
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                7. Service &amp; Repository Layer Code Design (DDD)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Interfaces and classes implementing Clean Architecture and business domains.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase">Service Layer Rules</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Repository layer doesn't make logical checks on permissions, only physical checks. Service layer acts as the domain gatekeeper:
                </p>
                <ul className="text-xs text-slate-600 list-disc ml-5 mt-2 space-y-1.5 leading-relaxed">
                  <li><strong>Isolation:</strong> Coordinates user operations by automatically attaching the verified token's <code>tenant_id</code>.</li>
                  <li><strong>Validation:</strong> Validates role compatibility (e.g. Managers and Staff must refer to a non-null existing branch).</li>
                  <li><strong>Atomicity:</strong> Encapsulates multi-row modifications such as updating user-branch associations and logging events.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase leading-relaxed">Python Repository Snippet (e.g., UserRepository)</h4>
                <pre className="bg-slate-950 text-slate-300 p-3 rounded mt-2 font-mono text-[10px] overflow-x-auto">
{`from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.models.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str, tenant_id: str) -> Optional[User]:
        return self.db.query(User).filter(
            User.user_id == user_id, 
            User.tenant_id == tenant_id
        ).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def list_by_tenant(self, tenant_id: str) -> List[User]:
        return self.db.query(User).filter(User.tenant_id == tenant_id).all()

    def list_by_branch(self, tenant_id: str, branch_id: str) -> List[User]:
        return self.db.query(User).filter(
            User.tenant_id == tenant_id, 
            User.branch_id == branch_id
        ).all()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "jwt" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm tracking-wide font-semibold text-slate-800 uppercase">
                8. JWT Lifecycle &amp; Role-Based Security Rules
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Strict request auditing flow, token expiry protocols, and API endpoint verification.
              </p>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
{`========================================= JWT AUTHENTICATION FLOW =========================================
 [Client Credentials]  ---> (POST /api/auth/login)  ---> [Verify Credentials] 
                                                                |
                                                                v
 [Client Token Cache]  <--- [Return Access + Refresh] <--- [Generate Tokens]
       |
       +---> [Requests Header: "Authorization: Bearer <Access Token>"]
                   |
                   v
       [Express/FastAPI Dependency Security Middleware]
                   |
                   +---> (1) Parse Header Signature
                   |
                   +---> (2) Validate expiration timestamp (exp)
                   |
                   +---> (3) Extract Payload Claims -> Inject to req.user / db session:
                   |         { "userId": "...", "tenantId": "...", "role": "Owner", "branchId": null }
                   |
                   v
       [RBAC Route Guard checks Roles / IDs match branch scopes]
                   |
     +-------------+-------------+
     |             |             |
     v             v             v
[Owner Only]  [Manager Only] [Authenticated User]
(Matches Role) (Check Branch) (Verify Token is valid)`}
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-slate-800 text-xs uppercase">14. Phase 1 Production Readiness Checklist</h4>
                <ul className="text-xs text-slate-600 list-disc ml-5 mt-2 space-y-1.5 leading-relaxed">
                  <li><strong>Database Connection Pooling:</strong> Ensure PostgreSQL connection pools are configured correctly for high traffic (e.g. min 5, max 20 connections per pod).</li>
                  <li><strong>API Secret Security:</strong> Check that the <code>JWT_SECRET</code> and DB passwords are never hardcoded and read strictly from cloud secrets.</li>
                  <li><strong>Password Security Level:</strong> Validate that PBKDF2/Bcrypt salts run sufficient hashing iterations (e.g. Bcrypt 12 rounds or PBKDF2 10,000 passes).</li>
                  <li><strong>Strict Multi-Tenant Queries:</strong> Set up automated integration tests verifying that users of Tenant A receive a 403 or 404 when querying Tenant B objects.</li>
                  <li><strong>Role Permission Matrix:</strong> Ensure unit tests confirm managers cannot perform CRUD on other branches, and staff cannot write anything.</li>
                  <li><strong>Alembic State Audits:</strong> Run <code>alembic check</code> before deployments to confirm the code models and active schema migrations perfectly align.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
