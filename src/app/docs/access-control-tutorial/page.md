---
title: TerminusDB Role-Based Access Control Tutorial
nextjs:
  metadata:
    title: TerminusDB Role-Based Access Control Tutorial
    description: Learn about role-based access control in TerminusDB using the JavaScript client to manage users, teams, and permissions.
    keywords: access control, RBAC, authentication, authorization, security
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/access-control-tutorial/
media: []
---

![Access Control Overview](/images/access-control/accesscontrol-01.png)

In this tutorial, you will learn about the role-based access control in TerminusDB. We will use the [AccessControl](/docs/javascript/#accesscontrol) driver in the TerminusDB JavaScript Client Library to access the TerminusDB system database and manage access control for three different users.

## Access Control Explained

The purpose of access control is to establish who the user is and what they can access. It is also essential to actively prevent users from accessing anything they should not and ensure the required security for a particular resource is enforced. At a high level, database access control is a selective restriction of access to data. It consists of two main components: authentication and authorization.

### Authentication

Authentication is a technique used to verify that someone is who they claim to be. Most of the time this verification process includes a username and a password but other methods such as token, PIN number, fingerprint scan, or smart card can be used as well. In order to conduct the process of authentication, it is essential that the user has an account in the system so that the authentication mechanism can interrogate that account.

### Authorization

The authorization process establishes if the user (who is already authenticated) is allowed to access a resource. In other words, authorization determines what a user is and is not permitted to do. The level of authorization that is given to a user is determined by the user role.

![Authentication and Authorization](/images/access-control/accesscontrol-02.png)

## Role-Based Access Control in TerminusDB

TerminusDB provides mechanisms to allow users to limit access to their resources. A *role/capability* system ensures that all users can perform only the operations permitted to them.

![Role-Based Access Control](/images/access-control/accesscontrol-03.png)

In order to add users, organizations, and manage access and roles, you need to be the database administrator. The main concepts of TerminusDB's access control mechanisms are:

### User

The database user has the capability to access a resource with a specific role.

### Role

Roles group actions that the user can perform. For example, an admin role would include the action `create_database`. The default Roles for TerminusDB are: **admin** (all actions are allowed) and **consumer**. You can create roles in the system database for different access needs.

### Capability

A capability is a relationship between a resource (scope) and a role (what the user can do). A user with a capability/role is allowed to perform a set of actions for an organization and database.

### Resource

Organization/Team or database.

### Organization/Team

A database or several databases sit under an organization/team. You can have many organizations each with their own group of databases. Users are assigned roles to an organization and that role filters down to the databases within the organization.

### Database

Databases belong to an organization and users inherit the organization User Role for the databases within an organization. You can override this role, adding a capability/role at database level to increase the user's level of access for a particular database.

## Install the Tutorial

Please [clone and install TerminusDB](https://github.com/terminusdb/terminusdb-bootstrap) and have it running.

Clone the access control tutorial:

```bash
git clone https://github.com/terminusdb/terminusdb-access-control.git
cd terminusdb-access-control
npm install
```

Now run the example:

```bash
npm run start
```

See the [Access Control Tutorial Source Code](/docs/access-control-tutorial-source/) for a detailed walkthrough of the code.

## Manage Access Control with the TerminusDB Dashboard

You can also manage access control with the TerminusDB local dashboard. Visit our [Document UI guide](/docs/document-ui-terminusdb/) for more information on managing your data.
