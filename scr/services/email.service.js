const config = require("./../config/config");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport(config.email.smtp);

const sendEmail = async (to, subject, template) => {
  const msg = { from: "info@zeitblast.com", to, subject, html: template };
  try {
    await transporter.sendMail(msg);
  } catch (error) {
    console.log("error is", error);
  }
};

const sendCsvFileThroughEmail = async (to, subject, text, csvFile) => {
  const msg = {
    from: "info@zeitblast.com",
    to,
    subject,
    text: text,
    attachments: [
      {
        filename: "exportProspect.csv",
        content: csvFile,
      },
    ],
  };
  await transporter.sendMail(msg);
};

module.exports = { sendEmail, sendCsvFileThroughEmail };
