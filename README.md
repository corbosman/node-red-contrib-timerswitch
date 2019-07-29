# node-red-contrib-timerswitch

This node was developed as a scheduler for time-sensitive projects like aquariums and terrariums but can be used for almost any project requiring a timer. 

# Features

* **A very easy and intuitive configuration interface. There are no bells and whistles that may confuse you**
* **Allows for precise timing, turning something on/off at an exact time and for any number of seconds, minutes or hours**
* **Gives you the ability to turn something on/off many times a day from a single node**
* **Can be controlled by sending messages to this node** 

#### Configuration
This node has a very easy to understand interface. Just set the ON/OFF times in hours/minutes/seconds and you're good to go. More information about the configuration can
be found in the info tab of the node. 

Example: turns on at 8am and off at 9am.
 
![](https://photos.smugmug.com/photos/i-ZtRFJHq/0/fe7158be/S/i-ZtRFJHq-S.png)

#### Timer
The timer was designed to be accurate. It will come on/off at the exact time specified while other timers can be off by as much as a minute. 
It also allows you to set a schedule in seconds, something other times generally don't support or only as a work-around. This makes this timer
especially suited for time-sensitive projects. 

Example: turns on at 8:15 exactly, and turns off 15 seconds later.

![](https://photos.smugmug.com/photos/i-HsKtRZm/0/1f15b7f4/S/i-HsKtRZm-S.png)

#### Multiple schedules 
This timer has the ability to turn something on/off multiple times a day. Examples could be an automated feeder, terrarium misting systems, garden watering systems and 
other devices that may need to be turned on/off more than once. Simply click the "add" button to add multiple schedules. 

Example: turns on 3 times a day for 15 minutes:

![](https://photos.smugmug.com/photos/i-L3rdxCX/0/9c7afe4f/S/i-L3rdxCX-S.png)


# FAQ

- **Why not simply use multiple nodes to control one device?**
Most of the time you can turn something on/off using multiple nodes, but this can cause problems in certain cases. Imagine you have multiple nodes, and you restart Node-Red. 
While starting up each node will send a message to say they are either on or off. Which one is correct? Is the device on or off? Sometimes there are ways around that, 
but this node does not have this problem. It will always know if a device needs to be on or off, and more so, it makes sure you don't mistakenly create overlapping 
or otherwise inaccurate schedules.

- **What do you mean with accurate?**
This timer was designed to turn on/off at exact times. Other timers often work using intervals where they check your schedule only once a minute or even less. This means when you
want something to come on at 08:00am, it may actually not come on until 30 seconds later. This node does not have this problem, it will come on at exactly 08:00:00am. 
This may or may not be important to you. 


- **Can you add feature X?**
You can always request additional features, but this node was not designed to have a lot of bells and whistles. It does a simple job and does it well without complicating things.
If you need dawn/dusk schedules or other features like that other timers can provide this.


# Installation
<hr>
<p>This node can be installed through the Node-Red palette or manually using npm in your node-red folder.</p>

```
$ npm install node-red-contrib-timerswitch --save
```





