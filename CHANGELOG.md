### 1.1.1

- minor change in status output, dont show 'empty' when there is no timer set.

### 1.1.0

- changed the "run" command to "resume" but run still works for backwards compatibility
- the resume command will now return the schedule to its normal operation and undo any manual or pause action.

### 1.0.1

- code cleanup

### 1.0.0

- stable release

### 0.0.12

**fixes**

- the scheduler was started too early which could cause msgs to get lost when sent to other nodes.
- the status could show the wrong message when turning manual mode on and off

### 0.0.11

**fixes**

- if the scheduler was started with a schedule going on yesterday and goes off in the future, the schedule was not started properly
- second on event never fired

### 0.0.10

**fixes**

- multiple versions of this node would overwrite each other. 


