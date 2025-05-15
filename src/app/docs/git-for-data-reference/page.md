---
nextjs:
  metadata:
    title: Git-for-Data Reference
    description: >-
      A how-to guide showing the main operations related to Git-for-Data with TerminusDB in the cloud environment
media: []
---

## Git-for-Data Reference

Git-for-Data is a feature of TerminusDB that allows you to use git-like operations on TerminusDB data product branches, including the ability to transport data between TerminusDB instances using `clone`, `push`, `pull` and `fetch`.

This is useful to collaborate on information by syncronizing content repositories with [cloud-hosted TerminusDB instances](https://dfrnt.com/hypergraph-content-studio/), and also between environments where network segmentation is strict, such as in IEC62443, Purdue model and other environments, as described in [Transfer data in operational technologies landscapes](/docs/operational-technologies-transfer). 

In addition to the transportation of data between TerminusDB instances, Git-for-Data also allows you to manage data product branches using equivalents to `rebase` (replay commits onto a separate branch) and `merge` (apply) commands.

The ability to `squash` a branch into a single commit, and to `reset` a branch to a previous commit complete the most important aspects of the git-for-data capabilities that enable model-based data to be managed effectively with revision control.

Additionally, TerminusDB includes the ability to perform `diff` and `patch` operations on data product branches, which allow you to compare and apply specific changes between branches, much like git does with regular files, but instead of structured data.

## The git-for-data operations

Git-for-data operations use what is called `remotes`, references stored in the data product for remote data products, including branch information and which layers exist so that `push` and `pull` operations can compare the local state, with the remote state. 

One or more `remotes` can be added to a data product.

To read more about the git-like model itself in the TerminusDB explanation, see the [Git-like model](/docs/terminusdb-explanation/#git-like-model) section and the [Commit Graphs](/docs/graphs-explanation/#commit-graphs) section of the explanation of the TerminusDB graphs.

### Fetching a Data Product

You can fetch a data product by using the `fetch` command, which will retrieve information about the layers stored in a remote data product and update local references for the remote data product. Note that both `remotes` and `fetch` operate on a data product level.

### Pull a Data Product

You can pull a branch of a data product to a local branch by using the `pull` command. Missing layers layers in a remote data product branch will be transported and appended to the local branch that is pulled to as long as the history follows a straight revision control line and has not diverged.

Schema operations are not pulled and need to be manually maintained. Only instance information is pulled between branches of data products.

### Push a Data Product

You can push a branch of a data product to a remote branch by using the `push` command. Missing layers layers in a local data product branch will be transported and appended to the remote branch that is pushed to as long as the history follows a straight revision control line and has not diverged.

Schema operations are not pushed and need to be manually applied.

## Cloning Data Products

Data products contain a main branch and sometimes additional branches. You can clone a data product by using the `clone` command, which will create a copy of the data product in the same, or a different TerminusDB instance. 

With cloning, the entire data product, including schema, all layers, all branches, title and description, and more, will be copied to the new data product in the new cloned data product. A remote is created automatically in the new data product, pointing to the original data product so that push and pull can be used easily.

When cloning a branch, remote authorization information is included to let the two TerminusDB instances communicate with each other behind the scenes. Practically, the set of layers to that are included the the data product are calculated and then transferred back to the requesting TerminusDB instance.

Cloning works well for moving a data product from a cloud-connected TerminusDB instance such as with the official DFRNT® [TerminusDB Git-for-Data Hosting](https://dfrnt.com/hypergraph-content-studio/), to another cloud instance, or to a local TerminusDB instance that can connect to the cloud instance.

When the source TerminusDB instance is in a location that a cloud instance can't connect to, it becomes necessary to perform reverse cloning operations, which is described in the next section.

### Reverse Branch Cloning

When a data product is to be cloned from a local instance to a cloud instance, the `clone` command can't be used as the cloud instance can't connect to a TerminusDB that is technically not accessible from the cloud network.

Instead, the set of layers to that are to be included has to be moved some other way, where the `fetch` and `push` commands are used.

An example of how to use git-for-data is in how to move a data product from a local TerminusDB instance, to a cloud instance, is described in [Manual Reverse Branch Cloning](/docs/manual-reverse-branch-cloning).

## Git-for-data branch operations

### Rebase

The `rebase` operation replays commits, layer changes, from one branch onto a different branch. This is similar to the `rebase` operation in git. The two branches must have a commit ancestor layer. The commit messages are retained.

### Merge

The `merge` operation applies commits, layer changes, from one branch onto a different branch as one squashed commit, where all changes are combined into one commit. This is similar to the `merge` operation in git. The two branches must have a commit ancestor layer.

### Squash

The `squash` operation merges all commits in the same branch into a single commit with flat history.

### Reset

The `reset` operation resets a branch to a previous commit, discarding all commits after the specified commit.

### Diff and patch

`diff` and `patch` operations are available to compare and apply specific changes between branches of data products. These operations are described in [JSON Diff and Patch](/docs/json-diff-and-patch).

## More about git-for-data

Read more about how git-for-data can be used in operational technologies environments in [Transfer data in operational technologies landscapes](/docs/operational-technologies-transfer), and how to clone individual branches of data products in [Manual Reverse Branch Cloning](/docs/manual-reverse-branch-cloning).