# Covey.Town

This implementation of covey.town allows town creators to choose between different maps when creating a town. The three map choices include a conference room, classroom, and the default playground.

In addition to map selection, the program provides different avatars to allow users to express themselves and distinguish themselves from others. While customization is useful, there might be situations where a town creator wants to limit player avatars and set a particular avatar for all players. To accommodate this, a town creator can choose to either allow no customization whatsoever, meaning all users, including the town creator, will have whatever avatar is set for the town during creation OR the town creator can allow certain users with a password to select whatever avatar while users without a password will be forced to choose the default avatar.\
**Note:** The aforementioned password for overriding avatar restrictions is different from the town update password, but similarly automatically generated and displayed one time to the town creator when the town has been created.

This program also allows users to enable or disable the proximity feature. When proximity is enabled, the players in the town can only see and hear other players nearby. When disabled, all players in a town and see and hear everyone in the same town. This is particularly useful for professors who would like all students to hear them in a classroom setting.

If the bandwidth is not enough the support a large number of students, there is a feature to turn off videos for all users in the town. This allows everyone to use less bandwidth and be able to hear each other without sacrificing the voice quality.

Seen below is implementation of custom avatar selection where all available avatar options can be cycled through with the arrow buttons. While looking through avatar choices, a preview of the avatar along with its name is displayed, in addition to the total number of avatars currently available. Additionally, if a player wants to override a town's default avatar with a password, it can be inputted in the text field below the avatar. Once the player attempts to join a room, the password will be validated and either send the player to the room or a descriptive error toast will pop-up.

![Avatar Selection](docs/Modified-Avatar-Selection-UI.png)

Below is the user interface that was changed to allow selection of map, enabling/disabling of video and proximity, and set avatar customization rules. The town map and avatar customization mode is selected using radio buttons, the video and proximity settings can be changed with checkboxes, and the default avatar is changed with a select input box.\
**Note**: The default avatar select only appears when 'Password Users' or 'No Users' is selected for avatar customization mode to avoid confusion when 'All Users' is selected.

![Map Selection](docs/Modified-Town-Creation-UI.png)

The town maps are created with Tiled software, which has no limitations on how many maps a user can create.

Once inside the town, the host, or anyone provided with the password of the town (given from host), can update map selection. Anyone with the town password can also enable/disable video and proximity using the town settings pop-up window. The procedure is the same as updating other town properties, such as name. Given the scope of our user stories and main purpose, it was intentionally decided to not allow avatar customization mode or the default avatar to be updated once a town was already created. This design choice results in data consistency for all users and ensures no users will unintentionally violate town avatar rules.

Below is the user interface changed to update town features.

![Town Setting](docs/Town-Setting-UI.png)

The town selection user interface was modified to list out the town's map ID, video and proximity status, and avatar customization mode. When avatar customization is password protected or locked, the name of the default avatar will also be displayed in the table.\
**Note:** Due to the additional columns, the Activity column and Connect button cannot fit in a single screenshot, but are still viewable using the bottom scroll bar in-app.

As shown below:

![Town List](docs/Modified-Town-List-UI.png)

The following shows an example of a new map along with users using different avatars.

![Conference Room](docs/Conf-Room-Avatar.png)

Below is the conference room and classroom layouts.

![Conf](docs/Confroom-Layout.png)
![Class](docs/Classroom-Layout.png)
