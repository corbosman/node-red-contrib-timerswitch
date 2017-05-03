# node-red-contrib-timer

<p>This is a Node-Red multi-schedule daily timer switch node which allows you to add multiple on/off periods for a single output with a minumum duration of 1 second.  
It is meant to resemble the functionality of mechanical and digital wall timers. </p>

<h2>Installation</h2>
<hr>
<p>This node can be installed through the Node-Red palette or manually using npm in your node-red folder.</p>

```
$ npm install node-red-contrib-timerswitch --save
```

<h2>Usage</h2>
<hr>
<p>
After installation this node needs to be configured through the node config editor. You can add one or more time
schedules and the node will emit output messages reflecting the beginning and end of a schedule. You can also send
a message to this node to manually control the output. More information can be found in the info tab of the node.
</p>





