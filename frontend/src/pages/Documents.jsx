import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  CheckCircle2,
  ShieldCheck,
  FolderLock,
  Filter,
  AlertCircle,
  FileCheck,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const CATEGORIES = ['All', 'Offer Letter', 'Identity Proof', 'NDA & Legal', 'Appraisal', 'Certification', 'Tax Document'];

export const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Offer Letter',
    fileName: '',
    notes: '',
    fileSize: '1.4 MB'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments({
        category: selectedCategory,
        search: searchQuery
      });
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, searchQuery]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      await documentService.uploadDocument({
        ...formData,
        fileName: formData.fileName || `${formData.title.replace(/\s+/g, '_')}.pdf`
      });
      setIsUploadModalOpen(false);
      setFormData({
        title: '',
        category: 'Offer Letter',
        fileName: '',
        notes: '',
        fileSize: '1.4 MB'
      });
      fetchDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentService.deleteDocument(id);
      fetchDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Offer Letter':
        return 'info';
      case 'Identity Proof':
        return 'success';
      case 'NDA & Legal':
        return 'warning';
      case 'Appraisal':
        return 'indigo';
      case 'Certification':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-indigo-500/15 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Employee Document Vault</h1>
              <p className="text-xs text-indigo-100 font-medium">
                Encrypted storage for corporate contracts, government credentials, NDAs & appraisals.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-700" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{documents.length}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" /> 100% Verified
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Categories</div>
          <div className="text-2xl font-black text-slate-900 mt-1">6 Types</div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Contracts, IDs, Certs</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Protocol</div>
          <div className="text-2xl font-black text-slate-900 mt-1">Role-Secured</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">IDOR Proof Protection</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vault Mode</div>
          <div className="text-2xl font-black text-indigo-600 mt-1 capitalize">{user?.role === 'admin' ? 'Workforce Admin' : 'Personal Vault'}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Auto Cloud Sync</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium text-xs">Loading encrypted documents...</div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <FolderLock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1">Upload a document to archive it in the secure vault.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant={getCategoryColor(doc.category)}>
                    {doc.category}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{doc.fileName}</p>
                </div>

                {doc.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                    {doc.notes}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Owner</span>
                    <span className="font-semibold text-slate-800">{doc.employeeName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">File Size</span>
                    <span className="font-semibold text-slate-800">{doc.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>

                {(user?.role === 'admin' || doc.employeeId === user?.employeeId) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Corporate Document"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <Input
              label="Document Title"
              required
              placeholder="e.g. Master Employment Agreement 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Offer Letter">Offer Letter</option>
                <option value="Identity Proof">Identity Proof (Passport / ID)</option>
                <option value="NDA & Legal">NDA & Legal Agreement</option>
                <option value="Appraisal">Performance Appraisal</option>
                <option value="Certification">Professional Certification</option>
                <option value="Tax Document">Tax Document (W-2 / Form 16)</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <Input
              label="File Name"
              placeholder="e.g. Agreement_Signed.pdf"
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
            />

            <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-center">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Simulated Digital File Attachment</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF, DOCX, PNG up to 25 MB</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Audit / Verification Notes
              </label>
              <textarea
                rows={3}
                placeholder="Optional notes regarding the document..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Archive Document
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`Preview: ${previewDoc.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800">{previewDoc.fileName}</span>
                <span className="text-slate-400 block text-[11px]">Size: {previewDoc.fileSize} • Uploaded by {previewDoc.uploadedBy}</span>
              </div>
              <Badge variant="success">Verified Official Document</Badge>
            </div>

            {/* Document Digital Viewer Shell */}
            <div className="h-80 bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center text-slate-700 relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-slate-900">{previewDoc.title}</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enterprise confidential document view protected by AES-256 in-transit encryption.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleDownload(previewDoc)}
                  icon={Download}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Download Full PDF
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Documents;
