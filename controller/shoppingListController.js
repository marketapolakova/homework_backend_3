const express = require("express");

const isAuthenticated = require("../middleware/isAuthenticated");
const isOwner = require("../middleware/isOwner");
const isOwnerOrContributor = require("../middleware/isOwnerOrContributor");
const ShoppingList = require("../model/ShoppingList");

const router = express.Router();

// get all lists for user
router.get("/", isAuthenticated, (req, res) => {
  ShoppingList.find({ owner: req.user.foundUser._id }, (err, lists) => {
    if (err) return res.status(400).json({ status: "error", errors: [err] });
    if (lists.length < 1) {
      return res.status(200).json({
        status: "empty",
        errors: [],
        data: "no shopping lists for given user",
      });
    } else {
      return res
        .status(200)
        .json({ status: "success", errors: [], data: lists });
    }
  });
});

// get list by id
router.get("/:listid", isAuthenticated, isOwnerOrContributor, (req, res) => {
  const listId = req.params.listid;
  ShoppingList.findById(
    listId,

    (err, list) => {
      if (err) {
        return res.status(400).json(new ErrorResponse("error", [err]));
      }
      if (!list) {
        return res
          .status(404)
          .json(new ErrorResponse("error", ["no list found for given id"]));
      } else {
        return res
          .status(200)
          .json({ status: "success", data: list, errors: [] });
      }
    }
  );
});

// create shopping list
router.post("/", isAuthenticated, (req, res) => {
  const body = req.body;
  const _shoppingList = new ShoppingList({
    name: body.name,
    items: body.items,
    owner: req.user.foundUser._id,
    contributors: body.contributors || [],
  });
  _shoppingList.save((err, result) => {
    if (err) {
      return res.status(400).json({ status: "error", errors: [err] });
    } else {
      res.status(201).json({ status: "created", data: result, errors: [] });
    }
  });
});

// delete shopping list
router.delete("/:listid", isAuthenticated, isOwner, (req, res) => {
  ShoppingList.findByIdAndDelete(req.params.listid, (err) => {
    if (err) {
      return res.status(400).json(new ErrorResponse("error", [err]));
    } else {
      return res.status(200).json({ status: "deleted", errors: [] });
    }
  });
});

// update shopping list
router.put("/:listid", isAuthenticated, isOwner, (req, res) => {
  if (!req.body.name)
    return res
      .status(400)
      .json(new ErrorResponse("error", ["new name not filled"]));
  ShoppingList.findByIdAndUpdate(
    req.params.listid,
    req.body,
    { new: true, rawResult: true, runValidators: true },
    (err, updatedList) => {
      if (err) {
        return res.status(400).json(new ErrorResponse("error", [err]));
      } else {
        return res
          .status(200)
          .json({ status: "updated", data: updatedList?.value, errors: [] });
      }
    }
  );
});

// add item to shopping list
router.post(
  "/:listid/item",
  isAuthenticated,
  isOwnerOrContributor,
  (req, res) => {
    ShoppingList.findByIdAndUpdate(
      req.params.listid,

      {
        $push: { items: req.body },
      },
      { new: true, rawResult: true, runValidators: true },
      (err, updatedList) => {
        if (err) {
          return res.status(400).json(new ErrorResponse("error", [err]));
        } else {
          return res
            .status(200)
            .json({ status: "updated", data: updatedList, errors: [] });
        }
      }
    );
  }
);

// rename item in shopping list
router.put(
  "/:listid/item/:itemid",
  isAuthenticated,
  isOwnerOrContributor,
  (req, res) => {
    console.log(req.body);

    ShoppingList.findByIdAndUpdate(
      req.params.listid,

      {
        $set: {
          items: { _id: req.params.itemid, name: req.body.name },
        },
      },
      { new: true, rawResult: true, runValidators: true },
      (err, updatedList) => {
        if (err) {
          return res.status(400).json(new ErrorResponse("error", [err]));
        } else {
          return res
            .status(200)
            .json({ status: "updated", data: updatedList, errors: [] });
        }
      }
    );
  }
);

// delete item from shopping list
router.delete(
  "/:listid/item/:itemid",
  isAuthenticated,
  isOwnerOrContributor,
  (req, res) => {
    ShoppingList.findByIdAndUpdate(
      req.params.listid,

      {
        $pull: { items: { _id: req.params.itemid } },
      },
      (err, updatedList) => {
        if (err) {
          return res.status(400).json(new ErrorResponse("error", [err]));
        } else {
          return res
            .status(200)
            .json({ status: "deleted", data: updatedList, errors: [] });
        }
      }
    );
  }
);

// check item in shopping list
router.get(
  "/:listid/item/:itemid/mark",
  isAuthenticated,
  isOwnerOrContributor,
  (req, res) => {
    ShoppingList.findByIdAndUpdate(
      req.params.listid,

      {
        $set: { items: { _id: req.params.itemid, checked: true } },
      },
      { new: true, rawResult: true, runValidators: true },
      (err, updatedList) => {
        if (err) {
          return res.status(400).json(new ErrorResponse("error", [err]));
        } else {
          return res
            .status(200)
            .json({ status: "updated", data: updatedList, errors: [] });
        }
      }
    );
  }
);

// add contributor
router.post("/:listid/contributor", isAuthenticated, isOwner, (req, res) => {
  ShoppingList.findByIdAndUpdate(
    req.params.listid,
    {
      $push: { contributors: req.body },
    },
    { new: true, rawResult: true, runValidators: true },
    (err, updatedList) => {
      if (err) {
        return res.status(400).json(new ErrorResponse("error", [err]));
      } else {
        return res.status(204).json({ status: "updated", errors: [] });
      }
    }
  );
});

// delete contributor
router.delete(
  "/:listid/contributor/:contributorid",
  isAuthenticated,
  isOwner,
  (req, res) => {
    ShoppingList.findByIdAndUpdate(
      req.params.listid,
      {
        $pull: { contributors: { _id: req.params.contributorid } },
      },
      { new: true, rawResult: true, runValidators: true, upsert: true },
      (err, updatedList) => {
        if (err) {
          return res.status(400).json(new ErrorResponse("error", [err]));
        } else {
          return res.status(204).json({ status: "updated", errors: [] });
        }
      }
    );
  }
);
module.exports = router;
