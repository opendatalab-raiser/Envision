# IMAGINE - Advanced Video Quality Assessment System

A comprehensive video quality evaluation platform with AI-powered assessment and correlation analysis capabilities.

## ✨ New Features

### 🎥 Custom Video Upload
- **Drag & Drop Support**: Simply drag and drop video files onto the upload area
- **File Validation**: Automatic validation of video file formats
- **Preview Integration**: Uploaded videos integrate seamlessly with the assessment workflow
- **Progress Feedback**: Visual feedback during upload and processing

### 🤖 AI-Powered Assessment
- **Automated Scoring**: AI automatically evaluates videos using the same criteria as human assessors
- **Real-time Analysis**: Get instant AI scores after human assessment
- **Consistent Evaluation**: AI uses the same 4-dimensional scoring system (Consistency, Causality, Aesthetic Quality, Physicality)
- **Professional Prompting**: Utilizes expert-level prompts for accurate assessment

### 📊 Correlation Analysis
- **Visual Comparison**: Side-by-side comparison of human vs AI scores
- **Correlation Coefficient**: Statistical analysis of agreement between human and AI assessments
- **Interactive Charts**: Dynamic scatter plot visualization
- **Agreement Levels**: Categorized agreement levels (Excellent, Good, Moderate, Weak, Poor)

## 🎯 Enhanced Workflow

1. **Select or Upload Video**
   - Choose from demo videos (AI Generated, Real Footage)
   - Upload your own custom video files
   - Drag & drop support for easy file handling

2. **Human Assessment**
   - Review detailed scoring criteria
   - Use sliders or keyboard shortcuts (0-5) for scoring
   - Real-time score updates with visual feedback

3. **AI Assessment**
   - Click "Get AI Assessment" to trigger automated analysis
   - AI evaluates using the same criteria as human assessors
   - Loading indicators and progress feedback

4. **Comparison & Analysis**
   - Visual comparison of human vs AI scores
   - Correlation analysis with statistical metrics
   - Interactive scatter plot visualization
   - Agreement level assessment

5. **Save & Export**
   - Save both human and AI assessments
   - Export data in CSV format
   - View assessment history with comparison data

## 🛠️ Technical Implementation

### AI Integration
- **API Ready**: Prepared for OpenAI API integration
- **Model Support**: Compatible with Qwen2.5-VL-72B-Instruct
- **Prompt Engineering**: Expert-level prompts for accurate assessment
- **Error Handling**: Robust error handling and user feedback

### Video Processing
- **Format Support**: Supports all major video formats
- **Frame Extraction**: Ready for frame extraction and analysis
- **Memory Management**: Efficient handling of large video files
- **Preview Generation**: Automatic video preview generation

### Data Visualization
- **Canvas-based Charts**: Custom correlation scatter plots
- **Real-time Updates**: Dynamic chart updates as scores change
- **Responsive Design**: Charts adapt to different screen sizes
- **Statistical Analysis**: Built-in correlation coefficient calculation

## 🎨 UI/UX Enhancements

### Upload Interface
- **Modern Design**: Clean, intuitive upload area
- **Visual Feedback**: Hover effects and drag states
- **Status Indicators**: Clear success/error messaging
- **Progress Animation**: Smooth loading animations

### Comparison Interface
- **Side-by-side Layout**: Clear human vs AI score comparison
- **Color Coding**: Blue for human scores, green for AI scores
- **Animated Bars**: Smooth bar chart animations
- **Metric Labels**: Clear labeling of all scoring dimensions

### Correlation Visualization
- **Interactive Charts**: Hover effects and data point labels
- **Grid System**: Professional chart grid and axes
- **Trend Lines**: Visual trend line representation
- **Statistical Display**: Real-time correlation metrics

## 📊 Scoring System

### Human Assessment
- **Consistency (0-5)**: Accuracy in reflecting prompts and explanations
- **Causality (0-5)**: Logical progression and visual coherence
- **Aesthetic Quality (0-5)**: Artistic appeal and visual quality
- **Physicality (0-5)**: Physical realism across four sub-metrics
  - Geometry, Color, Lighting, Counting

### AI Assessment
- **Same Criteria**: AI uses identical scoring dimensions
- **Expert Prompting**: Professional-grade assessment prompts
- **Consistent Evaluation**: Standardized scoring methodology
- **Statistical Validation**: Correlation analysis for reliability

## 🔧 Configuration

### API Setup
```javascript
// Configure OpenAI API
const client = OpenAI({
    base_url: "http://35.220.164.252:3888/v1/",
    api_key: "sk-XZWBrtapKYvdHFectMKUNORKrSMttCjuDZ5ve8nDSLi63yC6"
});
const model = "Qwen2.5-VL-72B-Instruct";
```

### Customization Options
- **Scoring Weights**: Adjustable weight for different metrics
- **Correlation Thresholds**: Customizable agreement level thresholds
- **Chart Styling**: Customizable chart colors and styles
- **Upload Limits**: Configurable file size and format restrictions

## 📈 Use Cases

### Research & Development
- **Algorithm Validation**: Compare AI models against human benchmarks
- **Quality Assessment**: Evaluate video generation algorithms
- **Bias Detection**: Identify systematic differences between human and AI assessments

### Educational Applications
- **Training Data**: Generate training data for assessment models
- **Student Evaluation**: Compare student assessments with AI benchmarks
- **Curriculum Development**: Develop assessment criteria and standards

### Professional Assessment
- **Quality Control**: Automated quality assessment in production pipelines
- **Consistency Monitoring**: Track assessment consistency over time
- **Performance Metrics**: Measure and improve assessment accuracy

## 🚀 Getting Started

1. **Open the Application**: Launch `index.html` in a modern web browser
2. **Select Video**: Choose a demo video or upload your own
3. **Human Assessment**: Complete your assessment using the scoring interface
4. **AI Assessment**: Click "Get AI Assessment" to trigger automated analysis
5. **Compare Results**: Review the correlation analysis and comparison charts
6. **Save Data**: Export your assessments for further analysis

## 🔮 Future Enhancements

- **Real-time AI Integration**: Live API connection for instant AI assessment
- **Advanced Analytics**: More sophisticated statistical analysis
- **Batch Processing**: Multiple video assessment capabilities
- **Custom Models**: Support for different AI assessment models
- **Collaborative Features**: Multi-user assessment and comparison

---

**IMAGINE** - Where human expertise meets AI precision in video quality assessment.
