# Backup Wordpress to Amazon S3

This project includes one bash script that installs and creates a backup that it stores on your Amazon S3. This project is also a npm module which can be used to install the bashscript on the relevant server and setup weekly cronjob.

wp-backup-core usage:

`yarn add wp-backup-core`

```js

import { backup, restore } from 'wp-backup-core'

backup({
 key: "your AWS key",
 secret: "your AWS secret",
 bucketname: "Name of AWS S3 bucket",
 host: "host ip or domain",
 username: "username of host",
 password: "password of host",
 port: "port for ssh login",
 name: "Name of project (used when saved to S3"),
 path: "/path/to/wordpress"
})
.then(() => console.log("success"))
.catch(console.log)

restore({
 bucketname: "Name of AWS S3 bucket",
 host: "host ip or domain",
 username: "username of host",
 password: "password of host",
 port: "port for ssh login",
 name: "Name of project (used when saved to S3"),
 path: "/path/to/wordpress"
})
.then(() => console.log("success"))
.catch(console.log)

singelBackup({
 host: "host ip or domain",
 username: "username of host",
 password: "password of host",
 port: "port for ssh login",
 bucketname: "Name of AWS S3 bucket",
 path: "/path/to/wordpress",
 name: "Name of project (used when saved to S3")
})
.then(() => console.log("success"))
.catch(console.log)

```


When using `singelBackup`, the name variable will override name used by `backup`, so you most likely want to use the same name as used by `backup`.
