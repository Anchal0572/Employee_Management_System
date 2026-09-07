const documentService = require('../services/documentService');
const asyncHandler = require('../utils/asyncHandler');

class DocumentController {
  getDocuments = asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    const documents = await documentService.getDocuments({
      user: req.user,
      category,
      search
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  });

  uploadDocument = asyncHandler(async (req, res) => {
    const document = await documentService.uploadDocument(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Document uploaded and securely archived successfully',
      data: document
    });
  });

  deleteDocument = asyncHandler(async (req, res) => {
    const result = await documentService.deleteDocument(req.params.id, req.user);
    res.status(200).json(result);
  });
}

module.exports = new DocumentController();
