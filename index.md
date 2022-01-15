# Server Webpage (Tentative Name)

## Description

This is the backend of a webpage serving server using nodejs express inside a docker container, created by a student learning to code and design responsive webpage.

This repository will include the description of different methods used in serving the webpage, and the producer of implmenting different functionalities of the webpage.

Different methods used during different stages of the repository can be reviewed using the commit history.

This repository will be updated regularly if I have free time to do so.
___

## Purpose

The purpose of this repository is to practice the use of nodedjs express and `CSS` skills. Multiple `CSS` and `javascript` approaches will be added to the same repository folder as the repository grows.

Moreover this webpage will be served as a record of my learning and designing process.
___

## Contributing or Feedbacks

If you are still reading, please consider helping me improve this repository or providing feedbacks by creating discussion threads or pull requests.

Any comments or suggestions are welcome and appreciated, to help me improving programming skills.
___

## Future RoadMap

- [ ] Landing page (Home Page)
- [ ] Responsive design
- [ ] comments on `js` and `css` files
- [ ] DRY the code

### Possible future features

- [ ] include p5js projects in a new folder
- [ ] Login required pages
- [ ] Session management
- [ ] Include database (Please recommend a database that can be used in docker)

___

## Usage

This repository is intended to be used in a docker container, and a file `/bin/config.json` is `.gitignore`d in this repository as this file is used to save the user credentials and other information which is required for login methods to work.

> **IMPORTANT: Read before Proceeding**  
> The security concerns of this file is not addressed in this repository as I do not have enough knowledge of web security and not intended to use a secure database during the early state of this repository.  
> Moreover this repository is intended to be used in a **private secure** network for **testing** and **learning purposes** **only**, sensitive information should **not** be stored in this file or within froks of this repository.

The structure of the `/bin/config.json` file is as follows:

``` json
{
    "users":
        "USERNAME":{
            "name": "NAME",
            "hash": "HASHED_PASSWORD",
            "salt": "SALT"
        }
}
```

Please start the nodejs server by running `npm start` in the root directory of the repository folder.
___
