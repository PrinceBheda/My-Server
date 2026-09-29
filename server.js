const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const open = require("open");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;




const ADMIN_PASSWORD = "PRINCE1558";




app.use(bodyParser.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "change-this-session-secret-please",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            // Localhost testing mate false
            // HTTPS online deployment ma true karjo
            secure: false,

            maxAge: 1000 * 60 * 60 * 4
        }
    })
);




app.use(express.static(__dirname));

app.use(
    "/songs",
    express.static(
        path.join(__dirname, "songs")
    )
);




let users = [];






app.get("/", (req, res) => {

    res.redirect("/register.html");

});




app.post("/register", (req, res) => {

    const {
        name,
        studentId,
        mobile,
        email
    } = req.body;


    /* ---------- VALIDATION ---------- */

    if (
        !name ||
        !studentId ||
        !mobile ||
        !email
    ) {

        return res.json({

            success: false,

            message:
                "All fields are required."

        });

    }


    /* ---------- DUPLICATE STUDENT ID ---------- */

    const alreadyExists =
        users.some(
            user =>
                String(user.studentId)
                    .trim()
                    .toLowerCase()
                ===
                String(studentId)
                    .trim()
                    .toLowerCase()
        );


    if (alreadyExists) {

        return res.json({

            success: false,

            message:
                "This Student ID is already registered."

        });

    }


    

    const participant = {

        name:
            String(name).trim(),

        studentId:
            String(studentId).trim(),

        mobile:
            String(mobile).trim(),

        email:
            String(email).trim(),

        age: null,


        registration: true,


        

        quizJoined: false,


       

        quizStatus:
            "Not Joined",


       

        quizCompleted: false,


        

        score: null

    };


    users.push(participant);


    

    res.json({

        success: true,

        message:
            "Registered Successfully",

        studentId:
            participant.studentId

    });

});



app.post("/quiz-join", (req, res) => {

    const {
        studentId
    } = req.body;


   

    if (!studentId) {

        return res.json({

            success: false,

            message:
                "Student ID is required."

        });

    }


  

    const userIndex =
        users.findIndex(
            user =>
                String(user.studentId)
                    .trim()
                    .toLowerCase()
                ===
                String(studentId)
                    .trim()
                    .toLowerCase()
        );


   

    if (userIndex === -1) {

        return res.status(404).json({

            success: false,

            message:
                "Student is not registered."

        });

    }


    

    users[userIndex].quizJoined =
        true;

    users[userIndex].quizStatus =
        "Playing";


  

    res.json({

        success: true,

        message:
            "Quiz Joined Successfully",

        participant: {

            name:
                users[userIndex].name,

            studentId:
                users[userIndex].studentId,

            quizJoined:
                users[userIndex].quizJoined,

            quizStatus:
                users[userIndex].quizStatus

        }

    });

});




app.post("/admin-login", (req, res) => {

    const {
        password
    } = req.body;


    if (
        password !==
        ADMIN_PASSWORD
    ) {

        return res.json({

            success: false,

            message:
                "Wrong Password"

        });

    }


    req.session.isAdmin = true;


    res.json({

        success: true,

        message:
            "Admin Login Successful"

    });

});




function requireAdmin(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.isAdmin === true
    ) {

        next();

    } else {

        res.status(401).json({

            success: false,

            message:
                "Admin Login Required"

        });

    }

}



app.post("/save-score", (req, res) => {

    const {
        studentId,
        score,
        age
    } = req.body;


   

    if (
        !studentId ||
        score === undefined ||
        score === null
    ) {

        return res.json({

            success: false,

            message:
                "Invalid score data"

        });

    }


    

    const userIndex =
        users.findIndex(
            user =>
                String(user.studentId)
                    .trim()
                ===
                String(studentId)
                    .trim()
        );


    if (userIndex === -1) {

        return res.json({

            success: false,

            message:
                "Participant is not registered."

        });

    }


   

    users[userIndex].quizCompleted =
        true;


    users[userIndex].score =
        Number(score);


    

    users[userIndex].quizStatus =
        "Completed";



    if (
        age !== undefined &&
        age !== null &&
        age !== ""
    ) {

        users[userIndex].age =
            Number(age);

    }


    

    res.json({

        success: true,

        message:
            "Score Saved Successfully",

        participant: {

            name:
                users[userIndex].name,

            studentId:
                users[userIndex].studentId,

            score:
                users[userIndex].score,

            quizJoined:
                users[userIndex].quizJoined,

            quizStatus:
                users[userIndex].quizStatus,

            quizCompleted:
                users[userIndex].quizCompleted

        }

    });

});




app.get("/leaderboard", (req, res) => {

    const publicLeaderboard =

        users
            .filter(
                user =>
                    user.quizCompleted === true
                    &&
                    user.score !== null
            )

            .sort(
                (a, b) =>
                    Number(b.score)
                    -
                    Number(a.score)
            )

            .map(
                user => ({

                    name:
                        user.name,

                    score:
                        user.score

                })
            );


    res.json(
        publicLeaderboard
    );

});




app.get("/verify-student/:studentId", requireAdmin, (req, res) => {

    const studentId =
        String(req.params.studentId).trim();

    const user =
        users.find(user =>
            String(user.studentId).trim().toLowerCase()
            ===
            studentId.toLowerCase()
        );

    if(!user){

        return res.json({
            success:false,
            message:"Student Not Found"
        });

    }

    res.json({

        success:true,

        participant:{

            name:user.name,

            studentId:user.studentId,

            mobile:user.mobile,

            email:user.email,

            registration:user.registration,

            quizJoined:user.quizJoined,

            quizStatus:user.quizStatus,

            quizCompleted:user.quizCompleted,

            score:user.score

        }

    });

});

app.get(
    "/admin-participants",
    requireAdmin,
    (req, res) => {

        const adminData =

            [...users].sort(
                (a, b) => {

                    /*
                       Completed students first
                    */

                    if (
                        a.quizCompleted
                        !==
                        b.quizCompleted
                    ) {

                        return a.quizCompleted
                            ? -1
                            : 1;

                    }


                    /*
                       Then highest score
                    */

                    return (
                        Number(b.score || 0)
                        -
                        Number(a.score || 0)
                    );

                }
            );


        
        const numberedData =
            adminData.map(
                (user, index) => ({

                    number:
                        index + 1,

                    ...user

                })
            );


        res.json(
            numberedData
        );

    }
);




app.post(
    "/delete-participant",
    requireAdmin,
    (req, res) => {

        const {
            studentId
        } = req.body;


        const index =
            users.findIndex(
                user =>
                    String(user.studentId)
                    ===
                    String(studentId)
            );


        if (index === -1) {

            return res.json({

                success: false,

                message:
                    "Participant Not Found"

            });

        }


        const removed =
            users.splice(
                index,
                1
            );


        res.json({

            success: true,

            message:
                "Participant Removed",

            removed:
                removed[0]

        });

    }
);



app.post(
    "/clear-leaderboard",
    requireAdmin,
    (req, res) => {

        users = [];


        res.json({

            success: true,

            message:
                "All Participants Cleared"

        });

    }
);




app.post(
    "/admin-logout",
    requireAdmin,
    (req, res) => {

        req.session.destroy(
            err => {

                if (err) {

                    return res.status(500)
                        .json({

                            success: false

                        });

                }


                res.json({

                    success: true

                });

            }
        );

    }
);




app.use(
    (req, res) => {

        res.status(404).send(
            "❌ Page Not Found"
        );

    }
);




app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "✅ Server Successfully Started"
        );

        console.log(
            `🌍 Click Here: http://localhost:${PORT}`
        );

        console.log(
            "🔐 Admin Password:",
            ADMIN_PASSWORD
        );

        console.log(
            "================================="
        );

    }
);