const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const sslChecker = require('ssl-checker');

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb" }));
app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));

const corsOrigin = "https://demo.cuberootdigital.in";
app.use(
	cors({
		origin: [corsOrigin],
		methods: ["GET", "POST"],
		credentials: true,
	})
);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads/EmailGenerator");
	},
	filename: function (req, file, cb) {
		let extArray = file.mimetype.split("/");
		let extension = extArray[extArray.length - 1];
		cb(null, `${file.fieldname}_dateVal_${Date.now()}.${extension}`);
	},
});

const qrCodeStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads/QrCode");
	},
	filename: function (req, file, cb) {
		let extArray = file.mimetype.split("/");
		let extension = extArray[extArray.length - 1];
		cb(null, `${file.fieldname}_dateVal_${Date.now()}.${extension}`);
	},
});

const menuFileStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		fs.mkdir(
			path.join(__dirname, "uploads", "QrCode","menu", req.body.folderName),
			function () {
				cb(null, "./uploads/QrCode/menu/" + req.body.folderName);
			}
		);
	},
	filename: function (req, file, cb) {
		let extArray = file.mimetype.split("/");
		let extension = extArray[extArray.length - 1];
		cb(null, `${file.originalname}.${extension}`);
	},
});

const imageUpload = multer({ storage: storage });

const upload = multer({ storage: qrCodeStorage });
const uploadMenuFiles = multer({ storage: menuFileStorage });

app.get("/tools-backend/sig/hello", (req, res) => {
	res.send("Hello world");
});

app.post("/tools-backend/sig/image-upload", imageUpload.single("my-image-file"), (req, res) => {
	res.send(req.file.filename);
});

app.post("/tools-backend/sig/image", upload.single("my-image-file"), (req, res) => {
	res.send(req.file.filename);
});

app.post("/tools-backend/sig/pdf-upload", upload.single("my-pdf-file"), (req, res) => {
	res.send(req.file.filename);
});

app.post("/tools-backend/sig/mp3-upload", upload.single("my-mp3-file"), (req, res) => {
	res.send(req.file.filename);
});

app.post("/tools-backend/sig/menu", uploadMenuFiles.array("items"), (req, res) => {
	const restaurantName = req.body.name;
	const description = req.body.description;

	const details = {
		restaurantName: restaurantName,
		description: description,
	};

	const filePath = path.join(
		__dirname,
		"uploads",
		"QrCode",
		"menu",
		req.body.folderName,
		"details.json"
	);

	fs.writeFileSync(filePath, JSON.stringify(details), "utf8", function (err) {
		res.status(400).send(err);
	});
	res.send("Added files");
});

app.post("/tools-backend/sig/app", upload.single(), (req, res) => {
	const androidUrl = req.body.android;
	const iosUrl = req.body.ios;
	const otherUrl = req.body.other;
	const details = {
		androidUrl: androidUrl,
		iosUrl: iosUrl,
		otherUrl: otherUrl,
	};

	const filePath = path.join(
		__dirname,
		"uploads",
		"QrCode",
		"app",
		req.body.folderName + ".json"
	);

	fs.writeFileSync(filePath, JSON.stringify(details), "utf8", function (err) {
		res.status(400).send(err);
	});
	res.send("Added details");
});

app.post("/tools-backend/sig/fb", upload.single(), (req, res) => {
	const username = req.body.username;
	const details = {
		username: username,
	};

	const filePath = path.join(
		__dirname,
		"uploads",
		"QrCode",
		"fb",
		req.body.folderName + ".json"
	);

	fs.writeFileSync(filePath, JSON.stringify(details), "utf8", function (err) {
		res.status(400).send(err);
	});
	res.send("Added details");
});

app.post("/tools-backend/sig/coupon", upload.single(), (req, res) => {
	const company = req.body.company;
	const discountType = req.body.discountType;
	const discountCode = req.body.discountCode;

	const details = {
		company: company,
		discountType: discountType,
		discountCode: discountCode,
	};

	const filePath = path.join(
		__dirname,
		"uploads",
		"QrCode",
		"coupon",
		req.body.folderName + ".json"
	);

	fs.writeFileSync(filePath, JSON.stringify(details), "utf8", function (err) {
		res.status(400).send(err);
	});
	res.send("Added details");
});

app.get("/tools-backend/sig/menu/:menuId", (req, res) => {
	const folderName = req.params.menuId;
	const baseURL = "https://demo.cuberootdigital.in/tools-backend/sig/uploads/QrCode/menu/" + folderName + "/";
	const details = JSON.parse(
		fs.readFileSync(
			path.join(
				__dirname,
				"uploads",
				"QrCode",
				"menu",
				folderName,
				"details.json"
			),
			"utf8"
		)
	);
	res.render("menu", {
		restaurantName: details.restaurantName,
		description: details.description,
		logoLink: baseURL + "Logo.png",
		breakfastLink: baseURL + "Breakfast.pdf",
		lunchLink: baseURL + "Lunch.pdf",
		dinnerLink: baseURL + "Dinner.pdf",
	});
});

app.get("/tools-backend/sig/app/:appId", (req, res) => {
	const fileName = req.params.appId;
	const details = JSON.parse(
		fs.readFileSync(
			path.join(
				__dirname,
				"uploads",
				"QrCode",
				"app",
				fileName + ".json"
			),
			"utf8"
		)
	);
	res.render("app", {
		android: details.androidUrl,
		ios: details.iosUrl,
		other: details.otherUrl,
	});
});

app.get("/tools-backend/sig/fb/:id", (req, res) => {
	const fileName = req.params.id;
	const details = JSON.parse(
		fs.readFileSync(
			path.join(__dirname, "uploads", "QrCode", "fb", fileName + ".json"),
			"utf8"
		)
	);
	res.render("fb", {
		username: details.username,
		fbLink: "https://www.facebook.com/" + details.username,
	});
});

app.get("/tools-backend/sig/coupon/:id", (req, res) => {
	const fileName = req.params.id;
	const details = JSON.parse(
		fs.readFileSync(
			path.join(
				__dirname,
				"uploads",
				"QrCode",
				"coupon",
				fileName + ".json"
			),
			"utf8"
		)
	);
	res.render("coupon", {
		company: details.company,
		discountType: details.discountType,
		discountCode: details.discountCode,
	});
});


app.post("/tools-backend/sig/ssl-check-url", (req, res) => {
	console.log(req.body);
	const host = req.body.host;
	sslChecker(host, { method: "GET", port: 443 })
		.then( (response) => res.send(response))
		.catch( (err) => res.send(err));
});

const port = 3000;
app.listen(port, function () {
	console.log(`Server is running on port ${port}`);
});