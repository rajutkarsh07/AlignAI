const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

class DocumentProcessor {
  constructor() {
    this.supportedFormats = {
      '.pdf': this.processPDF,
      '.docx': this.processDOCX,
      '.doc': this.processDOC,
      '.txt': this.processTXT
    };
  }

  // Main processing method
  async processDocument(filePath, originalName) {
    try {
      const fileExtension = path.extname(originalName).toLowerCase();
      
      if (!this.supportedFormats[fileExtension]) {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      const processor = this.supportedFormats[fileExtension];
      const content = await processor(filePath);
      
      return {
        success: true,
        content: content,
        metadata: {
          originalName,
          fileExtension,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error.message,
        content: null
      };
    }
  }

  // Process PDF files
  async processPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      // Clean and format the text
      let text = data.text;
      
      // Remove excessive whitespace
      text = text.replace(/\s+/g, ' ');
      
      // Remove page numbers and headers/footers
      text = text.replace(/\b\d+\s*$/gm, ''); // Remove page numbers at end of lines
      
      // Clean up line breaks
      text = text.replace(/\n\s*\n/g, '\n\n'); // Normalize paragraph breaks
      
      return text.trim();
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  // Process DOCX files
  async processDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (result.messages.length > 0) {
        console.warn('DOCX processing warnings:', result.messages);
      }
      
      let text = result.value;
      
      // Clean and format the text
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/\n\s*\n/g, '\n\n');
      
      return text.trim();
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  // Process DOC files (convert to DOCX first if needed)
  async processDOC(filePath) {
    try {
      // For now, we'll try to process DOC files as DOCX
      // In a production environment, you might want to use a library like antiword
      // or convert DOC to DOCX first
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (result.messages.length > 0) {
        console.warn('DOC processing warnings:', result.messages);
      }
      
      let text = result.value;
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/\n\s*\n/g, '\n\n');
      
      return text.trim();
    } catch (error) {
      throw new Error(`DOC processing failed: ${error.message}`);
    }
  }

  // Process TXT files
  async processTXT(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content.trim();
    } catch (error) {
      throw new Error(`TXT processing failed: ${error.message}`);
    }
  }

  // Extract key information from processed content
  async extractKeyInformation(content, type = 'general') {
    try {
      // Split content into manageable chunks
      const chunks = this.chunkContent(content, 2000);
      
      const extractedInfo = {
        summary: '',
        keyPoints: [],
        entities: [],
        sentiment: 'neutral',
        wordCount: content.split(/\s+/).length,
        characterCount: content.length
      };

      // Basic text analysis
      if (type === 'project') {
        extractedInfo.summary = this.extractProjectSummary(content);
        extractedInfo.keyPoints = this.extractProjectKeyPoints(content);
      } else if (type === 'feedback') {
        extractedInfo.summary = this.extractFeedbackSummary(content);
        extractedInfo.keyPoints = this.extractFeedbackKeyPoints(content);
        extractedInfo.sentiment = this.analyzeSentiment(content);
      }

      return extractedInfo;
    } catch (error) {
      console.error('Key information extraction error:', error);
      return {
        summary: 'Unable to extract key information',
        keyPoints: [],
        entities: [],
        sentiment: 'neutral',
        wordCount: 0,
        characterCount: 0
      };
    }
  }

  // Helper method to chunk content
  chunkContent(content, maxChunkSize) {
    const words = content.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += maxChunkSize) {
      chunks.push(words.slice(i, i + maxChunkSize).join(' '));
    }
    
    return chunks;
  }

  // Extract project-specific information
  extractProjectSummary(content) {
    // Simple heuristic to extract project summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const firstFewSentences = sentences.slice(0, 3).join('. ');
    return firstFewSentences.length > 200 ? firstFewSentences.substring(0, 200) + '...' : firstFewSentences;
  }

  extractProjectKeyPoints(content) {
    const keyPoints = [];
    const lines = content.split('\n');
    
    // Look for bullet points, numbered lists, or lines starting with key words
    const keyWords = ['goal', 'objective', 'target', 'feature', 'requirement', 'milestone'];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10 && trimmedLine.length < 200) {
        const hasKeyWord = keyWords.some(word => 
          trimmedLine.toLowerCase().includes(word)
        );
        
        if (hasKeyWord || trimmedLine.match(/^[\-\*•]\s/) || trimmedLine.match(/^\d+\.\s/)) {
          keyPoints.push(trimmedLine);
        }
      }
    });
    
    return keyPoints.slice(0, 10); // Limit to 10 key points
  }

  // Extract feedback-specific information
  extractFeedbackSummary(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const firstFewSentences = sentences.slice(0, 2).join('. ');
    return firstFewSentences.length > 150 ? firstFewSentences.substring(0, 150) + '...' : firstFewSentences;
  }

  extractFeedbackKeyPoints(content) {
    const keyPoints = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Look for sentences with feedback-related keywords
    const feedbackKeywords = ['bug', 'issue', 'problem', 'feature', 'request', 'suggestion', 'improvement', 'complaint'];
    
    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length > 10 && trimmedSentence.length < 200) {
        const hasFeedbackKeyword = feedbackKeywords.some(keyword => 
          trimmedSentence.toLowerCase().includes(keyword)
        );
        
        if (hasFeedbackKeyword) {
          keyPoints.push(trimmedSentence);
        }
      }
    });
    
    return keyPoints.slice(0, 8); // Limit to 8 key points
  }

  // Simple sentiment analysis
  analyzeSentiment(content) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'awesome', 'perfect', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'broken', 'useless'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Validate file size
  validateFileSize(fileSize, maxSize = 10 * 1024 * 1024) { // 10MB default
    return fileSize <= maxSize;
  }

  // Validate file type
  validateFileType(originalName) {
    const fileExtension = path.extname(originalName).toLowerCase();
    return Object.keys(this.supportedFormats).includes(fileExtension);
  }

  // Get file statistics
  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }
}

module.exports = new DocumentProcessor(); 