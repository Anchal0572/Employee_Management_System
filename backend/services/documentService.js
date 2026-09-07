const { getDbStatus } = require('../config/db');
const Document = require('../models/Document');
const ApiError = require('../utils/apiError');

const INITIAL_DOCUMENTS = [
  {
    _id: '66e1d0000000000000000001',
    title: 'Employment Offer Letter',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    category: 'Offer Letter',
    fileName: 'Sophia_Chen_Offer_Letter_2022.pdf',
    fileSize: '1.2 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    status: 'Verified',
    uploadedBy: 'Marcus Vance (HR)',
    notes: 'Signed and countersigned on onboarding.',
    createdAt: new Date('2022-03-10')
  },
  {
    _id: '66e1d0000000000000000002',
    title: 'Government Identity & Passport',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    category: 'Identity Proof',
    fileName: 'Passport_Copy_SC.pdf',
    fileSize: '2.4 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    status: 'Verified',
    uploadedBy: 'Sophia Chen',
    notes: 'Valid through 2030.',
    createdAt: new Date('2022-03-12')
  },
  {
    _id: '66e1d0000000000000000003',
    title: 'Proprietary Info & NDA Agreement',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    category: 'NDA & Legal',
    fileName: 'WorkPulse_NDA_Executed.pdf',
    fileSize: '840 KB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    status: 'Verified',
    uploadedBy: 'Legal Dept',
    notes: 'Company confidential IP protection terms.',
    createdAt: new Date('2022-03-15')
  },
  {
    _id: '66e1d0000000000000000004',
    title: 'AWS Certified Solutions Architect',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    category: 'Certification',
    fileName: 'AWS_Solutions_Architect_SC.pdf',
    fileSize: '1.1 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    status: 'Verified',
    uploadedBy: 'Sophia Chen',
    notes: 'Credential verified by Cloud DevOps Guild.',
    createdAt: new Date('2024-06-20')
  },
  {
    _id: '66e1d0000000000000000005',
    title: 'Annual Performance Appraisal 2025',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    category: 'Appraisal',
    fileName: 'Appraisal_Review_2025_SC.pdf',
    fileSize: '650 KB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mimeType: 'application/pdf',
    status: 'Verified',
    uploadedBy: 'Anchal Keshri (VP People)',
    notes: 'Exceeds Expectations (Rating 4.9/5).',
    createdAt: new Date('2025-12-15')
  }
];

class DocumentMemoryStore {
  constructor() {
    this.documents = new Map();
    INITIAL_DOCUMENTS.forEach((doc) => this.documents.set(doc._id, { ...doc }));
  }

  findAll({ role, employeeId, category, search }) {
    let list = Array.from(this.documents.values());

    if (role !== 'admin') {
      list = list.filter((doc) => doc.employeeId === employeeId);
    }

    if (category && category !== 'All') {
      list = list.filter((doc) => doc.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.fileName.toLowerCase().includes(q) ||
          (doc.employeeName && doc.employeeName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  create(docData) {
    const newDoc = {
      _id: '66e1d0000000000' + (this.documents.size + 1).toString().padStart(9, '0'),
      ...docData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.documents.set(newDoc._id, newDoc);
    return newDoc;
  }

  delete(id) {
    return this.documents.delete(id);
  }
}

const devStore = new DocumentMemoryStore();

class DocumentService {
  async getDocuments({ user, category, search }) {
    const isDbConnected = getDbStatus().isConnected;

    if (!isDbConnected) {
      return devStore.findAll({
        role: user.role,
        employeeId: user.employeeId,
        category,
        search
      });
    }

    const filter = {};
    if (user.role !== 'admin') {
      filter.employeeId = user.employeeId;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
        { employeeName: { $regex: search, $options: 'i' } }
      ];
    }

    return await Document.find(filter).sort({ createdAt: -1 });
  }

  async uploadDocument(docData, user) {
    const isDbConnected = getDbStatus().isConnected;

    const payload = {
      title: docData.title,
      employeeId: user.role === 'admin' && docData.employeeId ? docData.employeeId : user.employeeId,
      employeeName: user.role === 'admin' && docData.employeeName ? docData.employeeName : user.name,
      department: docData.department || user.department || 'General',
      category: docData.category || 'Other',
      fileName: docData.fileName || 'uploaded_document.pdf',
      fileSize: docData.fileSize || '1.2 MB',
      fileUrl: docData.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      mimeType: docData.mimeType || 'application/pdf',
      status: 'Verified',
      uploadedBy: user.name || 'System User',
      notes: docData.notes || ''
    };

    if (!isDbConnected) {
      return devStore.create(payload);
    }

    const doc = new Document(payload);
    return await doc.save();
  }

  async deleteDocument(id, user) {
    const isDbConnected = getDbStatus().isConnected;

    let doc;
    if (!isDbConnected) {
      doc = devStore.findById(id);
    } else {
      doc = await Document.findById(id);
    }

    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    if (user.role !== 'admin' && doc.employeeId !== user.employeeId) {
      throw ApiError.forbidden('You are not authorized to delete this document');
    }

    if (!isDbConnected) {
      devStore.delete(id);
      return { success: true, message: 'Document deleted successfully' };
    }

    await Document.findByIdAndDelete(id);
    return { success: true, message: 'Document deleted successfully' };
  }
}

module.exports = new DocumentService();
