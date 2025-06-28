const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { inboxService, emailService } = require("../services");
const pick = require("../utils/pick");
const { User, Batch, Admin, Inbox, CsvData } = require("../models");
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const getInboxList = catchAsync(async (req, res) => {
  let userId;
  // let userBatchIdArray = [];
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
      }
    }
  }

  // if (userId) {
  //   const user = await User.findById(userId);
  //   if (user) {
  //     const batch = await Batch.find({ user: user._id });
  //     if (batch.length > 0) {
  //       batch.forEach((item) => {
  //         userBatchIdArray.push(item._id);
  //       });
  //     }
  //   }
  // }
  try {
    let filter;
    let options = pick(req.query, ["limit", "page"]);
    options.sortBy = "updatedAt:desc";
    options.populate = "tags,reminder,campagin,batch,batch.user,dripAutomation";
    if (
      req.query.campaign &&
      req.query.status &&
      req.query.user &&
      req.query.tag
    ) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
              { user: userId },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        }
      }
    } else if (
      req.query.unRead &&
      req.query.campaign &&
      req.query.status &&
      req.query.user &&
      req.query.tag
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        }
      }
    } else if (
      req.query.unAnswered &&
      req.query.campaign &&
      req.query.status &&
      req.query.user &&
      req.query.tag
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
              { tags: req.query.tag },
            ],
          };
        }
      }
    } else if (
      req.query.unRead &&
      req.query.campaign &&
      req.query.status &&
      req.query.user
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (
      req.query.unAnswered &&
      req.query.campaign &&
      req.query.status &&
      req.query.user
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (
      req.query.unRead &&
      req.query.campaign &&
      req.query.user &&
      req.query.tag
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        }
      }
    } else if (
      req.query.unAnswered &&
      req.query.campaign &&
      req.query.tag &&
      req.query.user
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
              { tags: req.query.tag },
            ],
          };
        }
      }
    } else if (req.query.unRead && req.query.campaign && req.query.user) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campaign: req.query.campaign },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campaign },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campaign: req.query.campaign },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campaign },
            ],
          };
        }
      }
    } else if (req.query.unAnswered && req.query.campaign && req.query.user) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campaign: req.query.campaign },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campaign },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              {
                $or: [
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.isOutgoing",
                                { $subtract: [{ $size: "$messages" }, 1] },
                              ],
                            },
                            false,
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.isIncoming",
                                { $subtract: [{ $size: "$messages" }, 1] },
                              ],
                            },
                            true,
                          ],
                        },
                      ],
                    },
                  },
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone2.isOutgoing",
                                {
                                  $subtract: [{ $size: "$messagesPhone2" }, 1],
                                },
                              ],
                            },
                            false,
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone2.isIncoming",
                                {
                                  $subtract: [{ $size: "$messagesPhone2" }, 1],
                                },
                              ],
                            },
                            true,
                          ],
                        },
                      ],
                    },
                  },
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone3.isOutgoing",
                                {
                                  $subtract: [{ $size: "$messagesPhone3" }, 1],
                                },
                              ],
                            },
                            false,
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone3.isIncoming",
                                {
                                  $subtract: [{ $size: "$messagesPhone3" }, 1],
                                },
                              ],
                            },
                            true,
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
              { user: userId },
              { campaign: req.query.campaign },
            ],
          };
        } else {
          filter = {
            $and: [
              {
                $or: [
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.isOutgoing",
                                { $subtract: [{ $size: "$messages" }, 1] },
                              ],
                            },
                            false,
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.isIncoming",
                                { $subtract: [{ $size: "$messages" }, 1] },
                              ],
                            },
                            true,
                          ],
                        },
                      ],
                    },
                  },
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone2.isOutgoing",
                                {
                                  $subtract: [{ $size: "$messagesPhone2" }, 1],
                                },
                              ],
                            },
                            false,
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone2.isIncoming",
                                {
                                  $subtract: [{ $size: "$messagesPhone2" }, 1],
                                },
                              ],
                            },
                            true,
                          ],
                        },
                      ],
                    },
                  },
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone3.isOutgoing",
                                {
                                  $subtract: [{ $size: "$messagesPhone3" }, 1],
                                },
                              ],
                            },
                            false,
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messagesPhone3.isIncoming",
                                {
                                  $subtract: [{ $size: "$messagesPhone3" }, 1],
                                },
                              ],
                            },
                            true,
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campaign },
            ],
          };
        }
      }
    } else if (
      req.query.unRead &&
      req.query.campaign &&
      req.query.status &&
      req.query.user
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campaign: req.query.campagin },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campagin },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { campaign: req.query.campagin },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campagin },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (
      req.query.unAnswered &&
      req.query.campaign &&
      req.query.user &&
      req.query.status
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campaign: req.query.campagin },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campagin },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { campaign: req.query.campagin },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { campaign: req.query.campagin },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (
      req.query.unRead &&
      req.query.tag &&
      req.query.status &&
      req.query.user
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (
      req.query.unAnswered &&
      req.query.tag &&
      req.query.user &&
      req.query.status
    ) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (req.query.unRead && req.query.campaign && req.query.status) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { status: req.query.status },
            { campagin: req.query.campaign },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { status: req.query.status },
            { campagin: req.query.campaign },
          ],
        };
      }
    } else if (req.query.unRead && req.query.campaign && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { tags: req.query.tag },
            { campaign: req.query.campaign },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { tags: req.query.tag },
            { campagin: req.query.campaign },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.campaign && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { user: userId },
            { tags: req.query.tag },
            { campaign: req.query.campaign },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { tags: req.query.tag },
            { campagin: req.query.campaign },
          ],
        };
      }
    } else if (req.query.unRead && req.query.status && req.query.user) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (req.query.unAnswered && req.query.status && req.query.user) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (req.query.unRead && req.query.status && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.status && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { user: userId },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.unRead && req.query.status && req.query.campaign) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { campaign: req.query.campaign },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            //  {
            //     $or: [
            //       {
            //         messages: {
            //           $elemMatch: { isViewed: false, isIncoming: true },
            //         },
            //       },
            //       {
            //         messagesPhone2: {
            //           $elemMatch: { isViewed: false, isIncoming: true },
            //         },
            //       },
            //       {
            //         messagesPhone3: {
            //           $elemMatch: { isViewed: false, isIncoming: true },
            //         },
            //       },
            //     ],
            //   },
            { isUnRead: true },
            { campaign: req.query.campaign },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.status && req.query.campaign) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { user: userId },
            { campagin: req.query.campaign },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { campagin: req.query.campaign },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.unRead && req.query.campaign) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { campaign: req.query.campaign },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { campaign: req.query.campaign },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.campaign) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { user: userId },
            { campaign: req.query.campaign },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { campaign: req.query.campaign },
          ],
        };
      }
    } else if (req.query.unRead && req.query.user) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
            ],
          };
        }
      }
    } else if (req.query.unAnswered && req.query.user) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDnc", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone2", true],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //           {
              //             $ne: ["$isAddedToDNCPhone3", true],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { user: userId },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isOutgoing",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messages.isIncoming",
              //                   { $subtract: [{ $size: "$messages" }, 1] },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone2.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //     {
              //       $expr: {
              //         $and: [
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isOutgoing",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               false,
              //             ],
              //           },
              //           {
              //             $eq: [
              //               {
              //                 $arrayElemAt: [
              //                   "$messagesPhone3.isIncoming",
              //                   {
              //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
              //                   },
              //                 ],
              //               },
              //               true,
              //             ],
              //           },
              //         ],
              //       },
              //     },
              //   ],
              // },
              { isUnAnswered: true },
              { batch: { $in: batchIdArray } },
            ],
          };
        }
      }
    } else if (req.query.unRead && req.query.status && req.query.user) {
      options.sortBy = "updatedAt:desc";
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     {
              //       messages: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone2: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //     {
              //       messagesPhone3: {
              //         $elemMatch: { isViewed: false, isIncoming: true },
              //       },
              //     },
              //   ],
              // },
              { isUnRead: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (req.query.unRead && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { tags: req.query.tag },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { tags: req.query.tag },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { user: userId },
            { tags: req.query.tag },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { tags: req.query.tag },
          ],
        };
      }
    } else if (req.query.unRead && req.query.status && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { user: userId },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.status && req.query.tag) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { user: userId },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.campaign && req.query.user) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { campagin: req.query.campaign },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { campagin: req.query.campaign },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { campagin: req.query.campaign },
            ],
          };
        }
      }
    } else if (req.query.campaign && req.query.status) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { user: userId },
            { campagin: req.query.campaign },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { campagin: req.query.campaign },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.campaign && req.query.tag) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { user: userId },
            { campagin: req.query.campaign },
            { tags: req.query.tag },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { campagin: req.query.campaign },
            { tags: req.query.tag },
          ],
        };
      }
    } else if (req.query.campaign) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { user: userId },
            { campagin: req.query.campaign },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { campagin: req.query.campaign },
          ],
        };
      }
    } else if (req.query.tag && req.query.status && req.query.user) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (req.query.tag && req.query.user) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { tags: req.query.tag },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { tags: req.query.tag },
            ],
          };
        }
      }
    } else if (req.query.tag && req.query.status) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { user: userId },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { tags: req.query.tag },
            { status: req.query.status },
          ],
        };
      }
    } else if (req.query.tag) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { user: userId },
            { tags: req.query.tag },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { tags: req.query.tag },
          ],
        };
      }
    } else if (req.query.userName) {
      let searchPattern = req.query.userName;
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              $text: { $search: `"${searchPattern}"` },
            },
            { user: userId },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              $text: { $search: `"${searchPattern}"` },
            },
          ],
        };
      }
    } else if (req.query.unRead && req.query.status) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { status: { $in: req.query.status } },
            { user: userId },
          ],
        };
        // options.sortBy =
        //   "updatedAt:desc,messagesPhone2.creationDate:desc,messagesPhone3.creationDate:desc";
        options.sortBy = "updatedAt:desc";
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       messages: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone2: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //     {
            //       messagesPhone3: {
            //         $elemMatch: { isViewed: false, isIncoming: true },
            //       },
            //     },
            //   ],
            // },
            { isUnRead: true },
            { status: { $in: req.query.status } },
          ],
        };
        // options.sortBy =
        //   "updatedAt:desc,messagesPhone2.creationDate:desc,messagesPhone3.creationDate:desc";
        options.sortBy = "updatedAt:desc";
      }
    } else if (req.query.unRead) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          // $or: [
          //   { messages: { $elemMatch: { isViewed: false, isIncoming: true } } },
          //   {
          //     messagesPhone2: {
          //       $elemMatch: { isViewed: false, isIncoming: true },
          //     },
          //   },
          //   {
          //     messagesPhone3: {
          //       $elemMatch: { isViewed: false, isIncoming: true },
          //     },
          //   },
          // ],
          isUnRead: true,
          user: userId,
        };
        options.sortBy = "updatedAt:desc";
      } else {
        filter = {
          // $or: [
          //   { messages: { $elemMatch: { isViewed: false, isIncoming: true } } },
          //   {
          //     messagesPhone2: {
          //       $elemMatch: { isViewed: false, isIncoming: true },
          //     },
          //   },
          //   {
          //     messagesPhone3: {
          //       $elemMatch: { isViewed: false, isIncoming: true },
          //     },
          //   },
          // ],
          isUnRead: true,
        };
      }
    } else if (req.query.noStatus && req.query.status) {
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { status: { $in: "651ebe6f8042b1b3f4674ea4" } },
            { user: userId },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { status: { $in: "651ebe6f8042b1b3f4674ea4" } },
          ],
        };
      }
    } else if (req.query.unAnswered && req.query.status) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDncPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDncPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { status: { $in: req.query.status } },
            { user: userId },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isOutgoing",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messages.isIncoming",
            //                   { $subtract: [{ $size: "$messages" }, 1] },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDnc", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone2.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone2" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone2", true],
            //           },
            //         ],
            //       },
            //     },
            //     {
            //       $expr: {
            //         $and: [
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isOutgoing",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               false,
            //             ],
            //           },
            //           {
            //             $eq: [
            //               {
            //                 $arrayElemAt: [
            //                   "$messagesPhone3.isIncoming",
            //                   {
            //                     $subtract: [{ $size: "$messagesPhone3" }, 1],
            //                   },
            //                 ],
            //               },
            //               true,
            //             ],
            //           },
            //           {
            //             $ne: ["$isAddedToDNCPhone3", true],
            //           },
            //         ],
            //       },
            //     },
            //   ],
            // },
            { isUnAnswered: true },
            { status: { $in: req.query.status } },
          ],
        };
        options.sortBy = "updatedAt:desc";
      }
    } else if (req.query.unAnswered) {
      options.sortBy = "updatedAt:desc";
      if (userId) {
        filter = {
          // $or: [
          //   {
          //     $expr: {
          //       $and: [
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messages.isOutgoing",
          //                 { $subtract: [{ $size: "$messages" }, 1] },
          //               ],
          //             },
          //             false,
          //           ],
          //         },
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messages.isIncoming",
          //                 { $subtract: [{ $size: "$messages" }, 1] },
          //               ],
          //             },
          //             true,
          //           ],
          //         },
          //         {
          //           $ne: ["$isAddedToDnc", true],
          //         },
          //       ],
          //     },
          //   },
          //   {
          //     $expr: {
          //       $and: [
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone2.isOutgoing",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone2" }, 1],
          //                 },
          //               ],
          //             },
          //             false,
          //           ],
          //         },
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone2.isIncoming",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone2" }, 1],
          //                 },
          //               ],
          //             },
          //             true,
          //           ],
          //         },
          //         {
          //           $ne: ["$isAddedToDNCPhone2", true],
          //         },
          //       ],
          //     },
          //   },
          //   {
          //     $expr: {
          //       $and: [
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone3.isOutgoing",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone3" }, 1],
          //                 },
          //               ],
          //             },
          //             false,
          //           ],
          //         },
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone3.isIncoming",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone3" }, 1],
          //                 },
          //               ],
          //             },
          //             true,
          //           ],
          //         },
          //         {
          //           $ne: ["$isAddedToDNCPhone3", true],
          //         },
          //       ],
          //     },
          //   },
          // ],
          isUnAnswered: true,
          user: userId,
        };
      } else {
        filter = {
          // $or: [
          //   {
          //     $expr: {
          //       $and: [
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messages.isOutgoing",
          //                 { $subtract: [{ $size: "$messages" }, 1] },
          //               ],
          //             },
          //             false,
          //           ],
          //         },
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messages.isIncoming",
          //                 { $subtract: [{ $size: "$messages" }, 1] },
          //               ],
          //             },
          //             true,
          //           ],
          //         },
          //         {
          //           $ne: ["$isAddedToDnc", true],
          //         },
          //       ],
          //     },
          //   },
          //   {
          //     $expr: {
          //       $and: [
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone2.isOutgoing",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone2" }, 1],
          //                 },
          //               ],
          //             },
          //             false,
          //           ],
          //         },
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone2.isIncoming",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone2" }, 1],
          //                 },
          //               ],
          //             },
          //             true,
          //           ],
          //         },
          //         {
          //           $ne: ["$isAddedToDNCPhone2", true],
          //         },
          //       ],
          //     },
          //   },
          //   {
          //     $expr: {
          //       $and: [
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone3.isOutgoing",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone3" }, 1],
          //                 },
          //               ],
          //             },
          //             false,
          //           ],
          //         },
          //         {
          //           $eq: [
          //             {
          //               $arrayElemAt: [
          //                 "$messagesPhone3.isIncoming",
          //                 {
          //                   $subtract: [{ $size: "$messagesPhone3" }, 1],
          //                 },
          //               ],
          //             },
          //             true,
          //           ],
          //         },
          //         {
          //           $ne: ["$isAddedToDNCPhone3", true],
          //         },
          //       ],
          //     },
          //   },
          // ],
          isUnAnswered: true,
        };
      }
    } else if (req.query.user && req.query.status) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      }
    } else if (req.query.user) {
      const user = await User.findById(req.query.user);
      if (!user) {
        const admin = await Admin.findById(req.query.user);
        if (!admin) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        const batch = await Batch.find({ admin: admin._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [
              // { "messages.isIncoming": true },
              { isIncoming: true },
              { user: userId },
              { status: req.query.status },
            ],
          };
        } else {
          filter = {
            $and: [
              // { "messages.isIncoming": true },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
              { status: req.query.status },
            ],
          };
        }
      } else {
        const batch = await Batch.find({ user: user._id });
        if (batch.length <= 0) {
          let finalResult = {
            results: [],
            page: 1,
            limit: 25,
            totalPages: 0,
            totalResults: 0,
          };
          return res.status(httpStatus.CREATED).send(finalResult);
        }
        let batchIdArray = [];
        batch.forEach((item) => {
          batchIdArray.push(item._id);
        });
        if (userId) {
          filter = {
            $and: [{ isIncoming: true }, { user: userId }],
          };
        } else {
          filter = {
            $and: [
              // { "messages.isIncoming": true },
              { isIncoming: true },
              { batch: { $in: batchIdArray } },
            ],
          };
        }
      }
    } else if (req.query.status) {
      if (userId) {
        // if (req.query.status.toString() === "65ba97b6ae9753518b56d3d4") {
        //   filter = {
        //     $and: [
        //       {
        //         $or: [
        //           { "messages.isIncoming": true },
        //           { "messagesPhone2.isIncoming": true },
        //           { "messagesPhone3.isIncoming": true },
        //         ],
        //       },
        //       // { status: { $in: req.query.status } },
        //       { user: userId },
        //       {
        //         $or: [
        //           { isAddedToDNC: true },
        //           { isAddedToDNCPhone2: true },
        //           { isAddedToDNCPhone2: true },
        //         ],
        //       },
        //     ],
        //   };
        // } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { status: { $in: req.query.status } },
            { user: userId },
          ],
        };
        // }
      } else {
        // if (req.query.status.toString() === "65ba97b6ae9753518b56d3d4") {
        //   filter = {
        //     $and: [
        //       {
        //         $or: [
        //           { "messages.isIncoming": true },
        //           { "messagesPhone2.isIncoming": true },
        //           { "messagesPhone3.isIncoming": true },
        //         ],
        //       },
        //       // { status: { $in: req.query.status } },
        //       {
        //         $or: [
        //           { isAddedToDNC: true },
        //           { isAddedToDNCPhone2: true },
        //           { isAddedToDNCPhone2: true },
        //         ],
        //       },
        //     ],
        //   };
        // } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            { status: { $in: req.query.status } },
          ],
        };
        // }
      }
    } else {
      if (userId) {
        // if (req.query.status.toString() === "65ba97b6ae9753518b56d3d4") {
        //   filter = {
        //     $and: [
        //       {
        //         $or: [
        //           { "messages.isIncoming": true },
        //           { "messagesPhone2.isIncoming": true },
        //           { "messagesPhone3.isIncoming": true },
        //         ],
        //       },
        //       // { status: "651ebe828042b1b3f4674ea8" },
        //       { user: userId },
        //       {
        //         $or: [
        //           { isAddedToDNC: true },
        //           { isAddedToDNCPhone2: true },
        //           { isAddedToDNCPhone2: true },
        //         ],
        //       },
        //     ],
        //   };
        // } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              status: {
                $in: [
                  "651ebe268042b1b3f4674e9b",
                  "651ebe4e8042b1b3f4674e9d",
                  "651ebe5b8042b1b3f4674ea0",
                  "651ebe648042b1b3f4674ea2",
                  "651ebe6f8042b1b3f4674ea4",
                  "651ebe798042b1b3f4674ea6",
                  "651ebe828042b1b3f4674ea8",
                  "65ba97b6ae9753518b56d3d4",
                ],
              },
            },
            { user: userId },
          ],
        };
        // }
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              status: {
                $in: [
                  "651ebe268042b1b3f4674e9b",
                  "651ebe4e8042b1b3f4674e9d",
                  "651ebe5b8042b1b3f4674ea0",
                  "651ebe648042b1b3f4674ea2",
                  "651ebe6f8042b1b3f4674ea4",
                  "651ebe798042b1b3f4674ea6",
                  "651ebe828042b1b3f4674ea8",
                  "65ba97b6ae9753518b56d3d4",
                ],
              },
            },
          ],
        };
      }
    }
    let inbox = await inboxService.getInboxList(filter, options);
    if (inbox.results.length > 0) {
      inbox.results.forEach(async (item) => {
        // if (req.query.unAnswered) {
        //   item.messages = item.messages.filter((message, index, array) => {
        //     const lastMessageIsIncoming =
        //       index === array.length - 1 &&
        //       message.isIncoming === true &&
        //       item.isAddedToDNC !== true;
        //     if (lastMessageIsIncoming) {
        //       console.log("lastMessageIsIncoming is", lastMessageIsIncoming);
        //       return lastMessageIsIncoming;
        //     }
        //   });
        //   item.messagesPhone2 = item.messagesPhone2.filter(
        //     (message, index, array) => {
        //       const lastMessageIsIncoming =
        //         index === array.length - 1 &&
        //         message.isIncoming === true &&
        //         item.isAddedToDNCPhone2 !== true;
        //       if (lastMessageIsIncoming) {
        //         return lastMessageIsIncoming;
        //       }
        //     }
        //   );
        //   item.messagesPhone3 = item.messagesPhone3.filter(
        //     (message, index, array) => {
        //       const lastMessageIsIncoming =
        //         index === array.length - 1 &&
        //         message.isIncoming === true &&
        //         item.isAddedToDNCPhone3 !== true;
        //       if (lastMessageIsIncoming) {
        //         return lastMessageIsIncoming;
        //       }
        //     }
        //   );
        //   // console.log("incomingMessages", incomingMessages);
        // }
        if (req.query.unAnswered) {
          item.messages = filterMessages(
            item.messages,
            true,
            item.isAddedToDNC
          );
          item.messagesPhone2 = filterMessages(
            item.messagesPhone2,
            true,
            item.isAddedToDNCPhone2
          );
          item.messagesPhone3 = filterMessages(
            item.messagesPhone3,
            true,
            item.isAddedToDNCPhone3
          );
        }
        let phoneField = { phone1: "", phone2: "", phone3: "" };
        if (item.messages.length > 0) {
          const incomingMessages = item.messages.filter(
            (message) => message.isIncoming
          );
          const recentIncomingMessages = incomingMessages
            .sort((a, b) => b.creationDate - a.creationDate)
            .slice(0, 2);

          if (recentIncomingMessages.length > 0) {
            item.messages = recentIncomingMessages;
            phoneField.phone1 = item.to;
          }
        }

        ["Phone2", "Phone3"].forEach((phoneKey) => {
          const messagesPhoneKey = item[`messages${phoneKey}`];
          if (messagesPhoneKey.length > 0) {
            const incomingMessagesPhoneKey = messagesPhoneKey.filter(
              (message) => message.isIncoming
            );
            item.messages.push(...incomingMessagesPhoneKey);

            if (incomingMessagesPhoneKey.length > 0) {
              phoneField[`phone${phoneKey.slice(-1)}`] =
                item[`phone${phoneKey.slice(-1)}`];
            }
          }
        });

        const mergedMessages = item.messages
          .sort((a, b) => b.creationDate - a.creationDate)
          .slice(0, 2);

        item.messages = mergedMessages;
        item.responsePhone = { ...phoneField };
      });
      for (let i = 0; i < inbox.results.length > 0; i++) {
        if (inbox.results[i]?.batch) {
          if (inbox.results[i].batch.admin) {
            inbox.results[i].batch.admin = await Admin.findById(
              inbox.results[i].batch.admin
            );
          }
        }
      }
      inbox.results = inbox.results.filter((item) => item.messages.length > 0);
      return res.status(httpStatus.CREATED).send(inbox);
    } else {
      if (req.query.unRead && req.query.status) {
        for (let i = 0; i < inbox.results.length > 0; i++) {
          if (inbox.results[i]?.batch) {
            if (inbox.results[i].batch.admin) {
              inbox.results[i].batch.admin = await Admin.findById(
                inbox.results[i].batch.admin
              );
            } else {
              inbox.results[i].batch.user = await User.findById(
                inbox.results[i].batch.user
              );
            }
          }
        }

        inbox.results.forEach((item) => {
          if (item.messages.length > 0) {
            const incomingMessages = item.messages.filter(
              (message) =>
                message.isViewed === false && message.isIncoming === true
            );
            const recentIncomingMessages = incomingMessages
              .sort((a, b) => b.creationDate - a.creationDate)
              .slice(0, 2);
            item.messages = recentIncomingMessages;
          }

          if (item.messagesPhone2.length > 0) {
            const incomingMessagesPhone2 = item.messagesPhone2.filter(
              (message) =>
                message.isViewed === false && message.isIncoming === true
            );
            item.messages.push(...incomingMessagesPhone2);
          }

          if (item.messagesPhone3.length > 0) {
            const incomingMessagesPhone3 = item.messagesPhone3.filter(
              (message) =>
                message.isViewed === false && message.isIncoming === true
            );
            item.messages.push(...incomingMessagesPhone3);
          }

          const mergedMessages = item.messages
            .sort((a, b) => b.creationDate - a.creationDate)
            .slice(0, 2);

          item.messages = mergedMessages;
        });

        inbox.results = inbox.results.filter((item) => {
          return item.messages.length > 0;
        });
        return res.status(httpStatus.CREATED).send(inbox);
      } else if (req.query.unRead) {
        for (let i = 0; i < inbox.results.length > 0; i++) {
          if (inbox.results[i]?.batch) {
            if (inbox.results[i].batch.admin) {
              inbox.results[i].batch.admin = await Admin.findById(
                inbox.results[i].batch.admin
              );
            } else {
              inbox.results[i].batch.user = await User.findById(
                inbox.results[i].batch.user
              );
            }
          }
        }
        inbox.results.forEach((item) => {
          if (item.messages.length > 0) {
            const incomingMessages = item.messages.filter(
              (message) =>
                message.isViewed === false && message.isIncoming === true
            );
            const recentIncomingMessages = incomingMessages
              .sort((a, b) => b.creationDate - a.creationDate)
              .slice(0, 2);
            item.messages = recentIncomingMessages;
          }

          if (item.messagesPhone2.length > 0) {
            const incomingMessagesPhone2 = item.messagesPhone2.filter(
              (message) =>
                message.isViewed === false && message.isIncoming === true
            );
            item.messages.push(...incomingMessagesPhone2);
          }

          if (item.messagesPhone3.length > 0) {
            const incomingMessagesPhone3 = item.messagesPhone3.filter(
              (message) =>
                message.isViewed === false && message.isIncoming === true
            );
            item.messages.push(...incomingMessagesPhone3);
          }

          const mergedMessages = item.messages
            .sort((a, b) => b.creationDate - a.creationDate)
            .slice(0, 2);

          item.messages = mergedMessages;
        });

        inbox.results = inbox.results.filter((item) => {
          return item.messages.length > 0;
        });
        return res.status(httpStatus.CREATED).send(inbox);
      } else {
        return res.status(httpStatus.CREATED).send(inbox);
      }
    }
  } catch (error) {
    console.error("Error inserting data:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

function filterMessages(messages, isIncomingFlag, isAddedToDNCFlag) {
  return messages.filter((message, index, array) => {
    const lastMessageIsIncoming =
      index === array.length - 1 &&
      message.isIncoming === isIncomingFlag &&
      isAddedToDNCFlag !== true;
    if (lastMessageIsIncoming) {
      return lastMessageIsIncoming;
    }
  });
}

const getInboxDetail = catchAsync(async (req, res) => {
  if (!req.query.to && !req.query.phone2 && !req.query.phone3) {
    return res.status(400).send({ message: "To or phone2 phone3 is required" });
  }
  // let userId;
  // let userBatchIdArray = [];
  // if (req.user.role) {
  //   if (req.user.role.name) {
  //     if (req.user.role.name !== "admin") {
  //       userId = req.user._id;
  //     }
  //   }
  // }

  // if (userId) {
  //   const user = await User.findById(userId);
  //   if (user) {
  //     const batch = await Batch.find({ user: user._id });
  //     if (batch.length > 0) {
  //       batch.forEach((item) => {
  //         userBatchIdArray.push(item._id);
  //       });
  //     }
  //   }
  // }
  try {
    let filter;
    let options = pick(req.query, ["limit", "page"]);
    options.sortBy = "updatedAt:desc";
    options.populate = "tags,reminder,campagin,batch,dripAutomation";
    if (req.query.from && req.query.to) {
      filter = {
        $and: [{ from: req.query.from }, { to: req.query.to }],
      };
      options.populate = "tags,campagin,batch,reminder,dripAutomation";
      let inbox = await Inbox.paginate(filter, options);
      let phoneField = { phone1: "", phone2: "", phone3: "" };
      inbox.results.forEach((item) => {
        const incomingMessagesPhone2 = item.messagesPhone2.filter(
          (message) => message.isIncoming
        );
        const incomingMessagesPhone3 = item.messagesPhone3.filter(
          (message) => message.isIncoming
        );
        const incomingMessages = item.messages.filter(
          (message) => message.isIncoming
        );

        if (incomingMessagesPhone2.length > 0) {
          phoneField["phone2"] = item.phone2;
        }

        if (incomingMessagesPhone3.length > 0) {
          phoneField["phone3"] = item.phone3;
        }

        if (incomingMessages.length > 0) {
          phoneField["phone1"] = item.to;
        }

        item.responsePhone = { ...phoneField };
      });
      let finalResult = { results: inbox.results, inboxDetail: [] };
      return res.status(httpStatus.CREATED).send(finalResult);
    } else if (req.query.from && req.query.phone2) {
      filter = {
        $and: [{ from: req.query.from }, { phone2: req.query.phone2 }],
      };
      options.populate = "tags,campagin,batch,reminder,dripAutomation";
      let inbox = await Inbox.paginate(filter, options);
      let phoneField = { phone1: "", phone2: "", phone3: "" };
      inbox.results.forEach((item) => {
        const incomingMessagesPhone2 = item.messagesPhone2.filter(
          (message) => message.isIncoming
        );
        const incomingMessagesPhone3 = item.messagesPhone3.filter(
          (message) => message.isIncoming
        );
        const incomingMessages = item.messages.filter(
          (message) => message.isIncoming
        );

        if (incomingMessagesPhone2.length > 0) {
          phoneField["phone2"] = item.phone2;
        }

        if (incomingMessagesPhone3.length > 0) {
          phoneField["phone3"] = item.phone3;
        }

        if (incomingMessages.length > 0) {
          phoneField["phone1"] = item.to;
        }

        item.responsePhone = { ...phoneField };
      });
      let finalResult = { results: inbox.results, inboxDetail: [] };
      return res.status(httpStatus.CREATED).send(finalResult);
    } else if (req.query.from && req.query.phone3) {
      filter = {
        $and: [{ from: req.query.from }, { phone3: req.query.phone3 }],
      };
      options.populate = "tags,campagin,batch,reminder,dripAutomation";
      let inbox = await Inbox.paginate(filter, options);
      let phoneField = { phone1: "", phone2: "", phone3: "" };
      inbox.results.forEach((item) => {
        const incomingMessagesPhone2 = item.messagesPhone2.filter(
          (message) => message.isIncoming
        );
        const incomingMessagesPhone3 = item.messagesPhone3.filter(
          (message) => message.isIncoming
        );
        const incomingMessages = item.messages.filter(
          (message) => message.isIncoming
        );

        if (incomingMessagesPhone2.length > 0) {
          phoneField["phone2"] = item.phone2;
        }

        if (incomingMessagesPhone3.length > 0) {
          phoneField["phone3"] = item.phone3;
        }

        if (incomingMessages.length > 0) {
          phoneField["phone1"] = item.to;
        }

        item.responsePhone = { ...phoneField };
      });
      let finalResult = { results: inbox.results, inboxDetail: [] };
      return res.status(httpStatus.CREATED).send(finalResult);
    } else {
      return res
        .status(httpStatus.CREATED)
        .send({ message: "No query matched" });
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const exportProspects = catchAsync(async (req, res) => {
  try {
    let NoResponse = false;
    let filter;
    let body = req.body;
    if (body.campagin && body.status && body.tags && body.status.length <= 0) {
      filter = {
        $and: [
          {
            $or: [
              { "messages.isIncoming": false },
              { "messagesPhone2.isIncoming": false },
              { "messagesPhone3.isIncoming": false },
            ],
          },
          {
            updatedAt: {
              $gte: body?.monthDates?.from,
              $lt: body?.monthDates?.to,
            },
          },
          { campagin: { $in: body.campagin } },
          { tags: { $in: body.tags } },
          { status: "651ebe828042b1b3f4674ea8" },
        ],
      };
      NoResponse = true;
    } else if (body.campagin && body.status && body.tags) {
      if (body.isLeadVerified === true) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              $or: [
                { isVerifiedNumber: true },
                { isVerifiedNumberPhone2: true },
                { isVerifiedNumberPhone3: true },
              ],
            },
            {
              updatedAt: {
                $gte: body?.monthDates?.from,
                $lt: body?.monthDates?.to,
              },
            },
            { campagin: { $in: body.campagin } },
            { tags: { $in: body.tags } },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              updatedAt: {
                $gte: body?.monthDates?.from,
                $lt: body?.monthDates?.to,
              },
            },
            { campagin: { $in: body.campagin } },
            { status: { $in: body.status } },
            { tags: { $in: body.tags } },
          ],
        };
      }
    } else if (body.campagin && body.status && body.status.length <= 0) {
      filter = {
        $and: [
          {
            $or: [
              { "messages.isIncoming": false },
              { "messagesPhone2.isIncoming": false },
              { "messagesPhone3.isIncoming": false },
            ],
          },
          {
            updatedAt: {
              $gte: body?.monthDates?.from,
              $lt: body?.monthDates?.to,
            },
          },
          { campagin: { $in: body.campagin } },
          { status: "651ebe828042b1b3f4674ea8" },
        ],
      };
      NoResponse = true;
    } else if (body.campagin && body.status) {
      if (body.isLeadVerified === true) {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              $or: [
                { isVerifiedNumber: true },
                { isVerifiedNumberPhone2: true },
                { isVerifiedNumberPhone3: true },
              ],
            },
            {
              updatedAt: {
                $gte: body?.monthDates?.from,
                $lt: body?.monthDates?.to,
              },
            },
            { campagin: { $in: body.campagin } },
          ],
        };
      } else {
        filter = {
          $and: [
            // {
            //   $or: [
            //     { "messages.isIncoming": true },
            //     { "messagesPhone2.isIncoming": true },
            //     { "messagesPhone3.isIncoming": true },
            //   ],
            // },
            { isIncoming: true },
            {
              updatedAt: {
                $gte: body?.monthDates?.from,
                $lte: body?.monthDates?.to,
              },
            },
            { campagin: { $in: body.campagin } },
            { status: { $in: body.status } },
          ],
        };
      }
    }
    let inbox = await inboxService.exportProspects(filter, NoResponse);
    if (inbox.length > 0) {
      const csvFields = [
        {
          label: "First Name",
          value: `firstName`,
        },
        {
          label: "Last Name",
          value: `lastName`,
        },
        {
          label: "Lead Status",
          value: `leadStatus`,
        },
        {
          label: "Mailing Address",
          value: `mailingAddress`,
        },
        {
          label: "Mailing City",
          value: `mailingCity`,
        },
        {
          label: "Mailing State",
          value: `mailingState`,
        },
        {
          label: "Mailing Zip",
          value: `mailingZip`,
        },
        {
          label: "Property Address",
          value: `propertyAddress`,
        },
        {
          label: "Property City",
          value: `propertyCity`,
        },
        {
          label: "Property State",
          value: `propertyState`,
        },
        {
          label: "Property Zip",
          value: `propertyZip`,
        },
        {
          label: "Phone1",
          value: `phone1`,
        },
        {
          label: "Phone1 Type",
          value: `phone1Type`,
        },
        {
          label: "Phone2",
          value: `phone2`,
        },
        {
          label: "Phone2 Type",
          value: `phone2Type`,
        },
        {
          label: "Phone3",
          value: `phone3`,
        },
        {
          label: "Phone3 Type",
          value: `phone3Type`,
        },
        {
          label: "Email",
          value: `email`,
        },
        {
          label: "Verified Number",
          value: `verifiedNumber`,
        },
        {
          label: "Last Message Time",
          value: `lastMessageTime`,
        },
        {
          label: "Pushed To CRM",
          value: `pushedToCRM`,
        },
        {
          label: "Campaign",
          value: `campagin`,
        },
        {
          label: "Tags",
          value: `tags`,
        },
        {
          label: "Property County",
          value: `propertyCounty`,
        },
        {
          label: "Batch Id",
          value: `batchId`,
        },
        {
          label: "APN",
          value: `apn`,
        },
        {
          label: "Acreage",
          value: `acreage`,
        },
      ];
      const json2csvParser = new Json2csvParser({
        fields: csvFields,
      });
      let finalCsvDataArray = await inbox.map((item) => {
        return {
          firstName: item?.firstName ? item.firstName : "",
          lastName: item?.lastName ? item.lastName : "",
          leadStatus: item?.status ? item.status : "",
          mailingAddress: item?.mailingAddress ? item.mailingAddress : "",
          mailingCity: item?.mailingCity ? item.mailingCity : "",
          mailingState: item?.mailingState ? item.mailingState : "",
          mailingZip: item?.mailingZip ? item.mailingZip : "",
          propertyAddress: item?.propertyAddress ? item.propertyAddress : "",
          propertyCity: item?.propertyCity ? item.propertyCity : "",
          propertyState: item?.propertyState ? item.propertyState : "",
          propertyZip: item?.propertyZip ? item.propertyZip : "",
          phone1: item?.phone1 ? item.phone1 : "",
          phone1Type: item?.phone1Type ? item.phone1Type : "",
          phone2: item?.phone2 ? item.phone2 : "",
          phone2Type: item?.phone2Type ? item.phone2Type : "",
          phone3: item?.phone3 ? item.phone3 : "",
          phone3Type: item?.phone3Type ? item.phone3Type : "",
          email: item?.email ? item.email : "",
          verifiedNumber:
            item?.isPhone1Verified === true
              ? item?.phone1
              : item?.isPhone2Verified === true
              ? item?.phone2
              : item?.isPhone3Verified === true
              ? item?.phone3
              : "",
          lastMessageTime: item?.lastMessageSendDate
            ? moment(item.lastMessageSendDate).format("MM/DD/YY h:mm A")
            : "",
          pushedToCRM: item?.isPushedToCrm === true ? "TRUE" : "FALSE",
          campagin: item?.campagin ? item.campagin : "",
          tags: item?.tags
            ? item?.tags?.map((data) => data?.tag?.name).join(",")
            : "",
          propertyCounty: item?.propertyCounty ? item.propertyCounty : "",
          batchId: item?.batchId ? String(item.batchId) : "",
          apn: item?.apn ? item.apn : "",
          acreage: item?.acreage ? item.acreage : "",
        };
      });
      const csvData = json2csvParser.parse(finalCsvDataArray);
      const filePath = `prospectExport_${new Date().getTime()}.csv`;
      fs.writeFile(`public/uploads/${filePath}`, csvData, function (error) {
        if (error)
          throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Something went wrong while downloading..."
          );
        if (body.isEmail === true) {
          const csvFilePath = `public/uploads/${filePath}`;
          const csvFile = fs.readFileSync(csvFilePath, "utf8");
          emailService.sendCsvFileThroughEmail(
            body.email,
            "CSV File Attachment",
            "Attached is the CSV file you requested.",
            csvFile
          );
        }
        return res.download(`public/uploads/${filePath}`, function (err) {
          if (err) {
            console.error("Error while sending file:", err);
          } else {
            fs.unlink(`public/uploads/${filePath}`, function (deleteErr) {
              if (deleteErr) {
                console.error("Error while deleting file:", deleteErr);
              } else {
                console.log("File deleted successfully.");
              }
            });
          }
        });
      });
    } else {
      const csvFields = [
        {
          label: "First Name",
          value: `firstName`,
        },
        {
          label: "Last Name",
          value: `lastName`,
        },
        {
          label: "Lead Status",
          value: `leadStatus`,
        },
        {
          label: "Mailing Address",
          value: `mailingAddress`,
        },
        {
          label: "Mailing City",
          value: `mailingCity`,
        },
        {
          label: "Mailing State",
          value: `mailingState`,
        },
        {
          label: "Mailing Zip",
          value: `mailingZip`,
        },
        {
          label: "Property Address",
          value: `propertyAddress`,
        },
        {
          label: "Property City",
          value: `propertyCity`,
        },
        {
          label: "Property State",
          value: `propertyState`,
        },
        {
          label: "Property Zip",
          value: `propertyZip`,
        },
        {
          label: "Phone1",
          value: `phone1`,
        },
        {
          label: "Phone1 Type",
          value: `phone1Type`,
        },
        {
          label: "Phone2",
          value: `phone2`,
        },
        {
          label: "Phone2 Type",
          value: `phone2Type`,
        },
        {
          label: "Phone3",
          value: `phone3`,
        },
        {
          label: "Phone3 Type",
          value: `phone3Type`,
        },
        {
          label: "Email",
          value: `email`,
        },
        {
          label: "Verified Number",
          value: `verifiedNumber`,
        },
        {
          label: "Last Message Time",
          value: `lastMessageTime`,
        },
        {
          label: "Pushed To CRM",
          value: `pushedToCRM`,
        },
        {
          label: "Campaign",
          value: `campagin`,
        },
        {
          label: "Tags",
          value: `tags`,
        },
        {
          label: "Property County",
          value: `propertyCounty`,
        },
        {
          label: "Batch Id",
          value: `batchId`,
        },
        {
          label: "APN",
          value: `apn`,
        },
        {
          label: "Acreage",
          value: `acreage`,
        },
      ];
      const json2csvParser = new Json2csvParser({
        fields: csvFields,
      });
      let finalCsvDataArray = [
        {
          firstName: "",
          lastName: "",
          leadStatus: "",
          mailingAddress: "",
          mailingCity: "",
          mailingState: "",
          mailingZip: "",
          propertyAddress: "",
          propertyCity: "",
          propertyState: "",
          propertyZip: "",
          phone1: "",
          phone1Type: "",
          phone2: "",
          phone2Type: "",
          phone3: "",
          phone3Type: "",
          email: "",
          verifiedNumber: "",
          lastMessageTime: "",
          pushedToCRM: "",
          tags: "",
          propertyCounty: "",
          batchId: "",
          apn: "",
          acreage: "",
        },
      ];
      const csvData = json2csvParser.parse(finalCsvDataArray);
      const filePath = `prospectExport_${new Date().getTime()}.csv`;
      fs.writeFile(`public/uploads/${filePath}`, csvData, function (error) {
        if (error)
          throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Something went wrong while downloading..."
          );
        if (body.isEmail === true) {
          const csvFilePath = `public/uploads/${filePath}`;
          const csvFile = fs.readFileSync(csvFilePath, "utf8");
          emailService.sendCsvFileThroughEmail(
            body.email,
            "CSV File Attachment",
            "Attached is the CSV file you requested.",
            csvFile
          );
        }
        return res.download(`public/uploads/${filePath}`, function (err) {
          if (err) {
            console.error("Error while sending file:", err);
          } else {
            fs.unlink(`public/uploads/${filePath}`, function (deleteErr) {
              if (deleteErr) {
                console.error("Error while deleting file:", deleteErr);
              } else {
                console.log("File deleted successfully.");
              }
            });
          }
        });
      });
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const inboxResponses = catchAsync(async (req, res) => {
  try {
    let inboxes = await Inbox.find({
      $or: [
        { "messages.isIncoming": true },
        { "messagesPhone2.isIncoming": true },
        { "messagesPhone3.isIncoming": true },
      ],
    });
    res.status(httpStatus.CREATED).send(inboxes);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const connectCrm = catchAsync(async (req, res) => {
  let body = req.body;
  body.isCrmActive = true;
  let inbox = await inboxService.connectCrm(body);
  res.status(httpStatus.CREATED).send(inbox);
});

const updateCrm = catchAsync(async (req, res) => {
  let body = req.body;
  let inbox = await inboxService.updateCrm(body);
  res.status(httpStatus.CREATED).send(inbox);
});

const getIntegratedCrm = catchAsync(async (req, res) => {
  let inbox = await inboxService.getIntegratedCrm();
  res.status(httpStatus.CREATED).send(inbox);
});

const verifyCrm = catchAsync(async (req, res) => {
  let { link } = req.body;
  let inbox = await inboxService.verifyCrm(link);
  res.status(httpStatus.CREATED).send(inbox);
});

const changeCrmStatus = catchAsync(async (req, res) => {
  let body = req.body;
  let inbox = await inboxService.changeCrmStatus(body);
  res.status(httpStatus.CREATED).send(inbox);
});

module.exports = {
  getInboxList,
  getInboxDetail,
  exportProspects,
  inboxResponses,
  connectCrm,
  updateCrm,
  getIntegratedCrm,
  verifyCrm,
  changeCrmStatus,
};
