import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { fileQueue } = require('../queue');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const ensureDirectoryExists = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const FilesController = {
  postUpload: async (req, res) => {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (parentId !== 0) {
        const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const file = {
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      };

      if (type === 'folder') {
        const result = await dbClient.db.collection('files').insertOne(file);

        // Add a job to the fileQueue to generate thumbnails
        await fileQueue.add({
          userId: user._id,
          fileId: result.insertedId,
        });
        const createdFile = { id: result.insertedId, ...file };
        delete createdFile._id;
        return res.status(201).json(createdFile);
      }
      ensureDirectoryExists(FOLDER_PATH);
      const filePath = path.join(FOLDER_PATH, `${uuidv4()}`);

      const fileContent = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, fileContent);

      file.localPath = filePath;

      const result = await dbClient.db.collection('files').insertOne(file);
      const createdFile = { id: result.insertedId, ...file };
      delete createdFile._id;
      delete createdFile.localPath;
      return res.status(201).json(createdFile);
    } catch (err) {
      console.error('Error creating file:', err);
      return res.status(500).json({ error: 'An error occurred while creating the file' });
    }
  },
  getShow: async (req, res) => {
    const { id } = req.params;
    const { 'x-token': token } = req.headers;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: user._id });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.json(file);
    } catch (err) {
      console.log('Error retrieving file:', err);
      return res.status(500).json({ error: 'An error occurred while retrieving the file' });
    }
  },
  getIndex: async (req, res) => {
    const { 'x-token': token } = req.headers;
    const { parentId = '0', page = '0' } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pageSize = 20;
      const skip = parseInt(page, 10) * pageSize;
      let files = null;
      if (parentId === '0') {
        files = await dbClient.db
          .collection('files').aggregate([
            { $match: { userId: user._id } },
            { $skip: skip },
            { $limit: pageSize },
          ])
          .toArray();
      } else {
        files = await dbClient.db
          .collection('files')
          .aggregate([
            { $match: { userId: user._id, _id: ObjectId(parentId) } },
            { $skip: skip },
            { $limit: pageSize },
          ])
          .toArray();
      }
      return res.json(files);
    } catch (err) {
      console.error('Error retrieving files:', err);
      return res.status(500).json({ error: 'An error occurred while retrieving the files' });
    }
  },

  putPublish: async (req, res) => {
    const { 'x-token': token } = req.headers;
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: user._id });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });

      const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });

      return res.json(updatedFile);
    } catch (err) {
      console.error('Error updating file:', err);
      return res.status(500).json({ error: 'An error occurred while updating the file' });
    }
  },

  putUnpublish: async (req, res) => {
    const { 'x-token': token } = req.headers;
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: user._id });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });

      const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });

      return res.json(updatedFile);
    } catch (err) {
      console.error('Error updating file:', err);
      return res.status(500).json({ error: 'An error occurred while updating the file' });
    }
  },

  getFile: async (req, res) => {
    const { id } = req.params;
    const { 'x-token': token } = req.headers;
    const { size } = req.query;

    try {
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const userId = await redisClient.getAsync(`auth_${token}`);

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

      // Check if the file is public or if the user is authenticated and is the owner
      const isPublic = file.isPublic || (user && user._id.equals(ObjectId(file.userId)));
      if (!isPublic) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if the file is a folder
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // Check if the file is locally present
      const filePath = file.localPath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get the MIME-type based on the file name
      const mimeType = mime.lookup(file.name);

      // Set the appropriate Content-Type header
      res.setHeader('Content-Type', mimeType);

      // Generate the thumbnail file path based on the size
      const thumbnailPath = `${filePath}_${size}`;

      // Check if the thumbnail file exists
      const thumbnailExists = await fs.exists(thumbnailPath);
      if (!thumbnailExists) {
        return res.status(404).json({ error: 'Not found' });
      }
      // Send the file as the response
      return res.sendFile(filePath);
    } catch (err) {
      console.error('Error retrieving file:', err);
      return res.status(500).json({ error: 'An error occurred while retrieving the file', details: err });
    }
  },
};

module.exports = FilesController;
