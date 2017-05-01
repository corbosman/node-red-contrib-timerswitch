# node-red-contrib-timer

<p>This is a multi-schedule daily time switch node which allows you to add multiple on/off periods for a single output with a minumum duration of 1 second.  It is meant to resemble the functionality of mechanical and digital wall timers. </p>

<p><b>Configuration</b>
<ul>
    <li><code>name</code> - The name of the node as shown in the node editor (default: time switch)</li>
    <li><code>pause</code> - This allows you to temporarily pause the scheduler. <b>Note:</b> incoming messages will still change the output.</li>
    <li><code>schedules</code> - Here you define the on/off schedules. You can add more on/off periods by clicking the add button.
    You must fill in all fields, hours, minutes and seconds. <b>Note:</b> Overlapping time periods are considered an error.
    Schedules that are not considered valid will turn red in the editor and will not be activated on deploy.</li>
    <li><code>payload</code> - The payload to send to the output. (default: on/off)</li>
    <li><code>topic</code> - The topic to send to the output. (default: empty)</li>
</ul>
<p><b>Output</b>
<ul>
    <li><code>msg.payload</code> - The payload as configured in the node (default: on/off).</li>
    <li><code>msg.topic</code> - The topic as configured in the node.</li>
</ul>

<p><b>Input</b>

<ul>
    <li><code>msg.payload</code> - <i>string</i> <br><br>
    You can send a msg to this node to manually override the schedule.
    Send an <code>on</code>,<code>1</code> or <code>true</code> to immediately turn the output on. Alternatively send <code>off</code>,<code>0</code> or <code>false</code> to turn it off.
    It will output the configured on/off payload and topic, unless they are empty in which case they will pass on the existing payload and topic.
    Other attributes are passed on untouched. <b>Note:</b>: Unless the scheduler is paused the next scheduled time will reset the manual override. </li>
    <br>
    You can also send a <code>pause</code> command through the input which will pause the scheduler.
     <b>Note:</b> this is not saved and the schedule will continue after a restart of Node-Red.
</ul>

