## Text Version Control System

1. **Problem Statement**
   A full-stack system is required to manage wiki pages as immutable, version-controlled repositories where each edit creates a new, permanent node that can branch from any prior state, forming a directed acyclic graph (DAG) instead of a linear history. This application must support core version control operations—such as forking pages, merging divergent branches, and resolving text-based conflicts—while strictly enforcing the underlying DAG's integrity to prevent circular references and ensure traceability. Ultimately, the system must provide interfaces for users to navigate, compare, and reconcile any versions within this non-linear, branching history simultaneously.

2. **Prompt Used**
   Build a full-stack Next.js application where each wiki page is treated as a version-controlled repository, not a single evolving document. Instead of a linear edit history, every edit produces a new version node that can diverge from any previous state, forming independent branches by default. Pages must support forking, merging, and conflict resolution, similar to Git, but applied to human-readable text. Multiple versions of the same page may exist simultaneously, and no version is ever overwritten or deleted. All versions are connected through explicit parent relationships and collectively form a directed acyclic graph (DAG) that represents the page’s full history. The system must enforce this DAG structure at all times, ensuring that version history remains immutable, traceable, and non-circular, while allowing users to navigate, compare, and reconcile divergent versions through merges and manual conflict resolution.

3. **Requirements Specified**
   Criteria that must be met for this task:

   1. Each wiki page must store multiple immutable versions
   2. Every edit creates a new version and may branch from any previous version
   3. Version history must be represented as a directed acyclic graph (DAG)
   4. Versions reference one or more parent versions
   5. Two versions of the same page can be merged into a new version
   6. Automatic merging is attempted; conflicts are detected when edits overlap
   7. Conflicts can be manually resolved to produce a final merged version
   8. Users can view version history including branches and merges

4. **Commands:**
   - Commands to run tests on `repository_before`:
     ```bash
     docker compose run test-before
     ```
   - Commands to run tests on `repository_after`:
     ```bash
     docker compose run test-after
     ```
   - Commands to run `evaluation/evaluation.ts` and generate reports:
     ```bash
     docker compose run evaluation
     ```
