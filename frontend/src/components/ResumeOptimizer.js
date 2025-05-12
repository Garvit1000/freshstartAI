import { Box, Typography, CircularProgress, Paper, Grid, Divider } from '@mui/material';

// Add ATS Score Display Component
const ATSScoreDisplay = ({ scores }) => {
  const ScoreCard = ({ title, score, color }) => (
    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={score}
          size={80}
          thickness={4}
          sx={{ color }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" component="div" color="text.secondary">
            {`${Math.round(score)}%`}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  const AnalysisList = ({ title, items }) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      {items.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {items.map((item, index) => (
            <li key={index}>
              <Typography variant="body2">{item}</Typography>
            </li>
          ))}
        </ul>
      ) : (
        <Typography variant="body2" color="text.secondary">No issues found</Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>ATS Score Analysis</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Original Resume</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ScoreCard
                title="Overall Score"
                score={scores.original.overallScore}
                color={scores.original.overallScore >= 70 ? 'success.main' : 'warning.main'}
              />
            </Grid>
            <Grid item xs={6}>
              <ScoreCard
                title="Keyword Match"
                score={scores.original.keywordScore}
                color={scores.original.keywordScore >= 70 ? 'success.main' : 'warning.main'}
              />
            </Grid>
          </Grid>
          <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
            <AnalysisList title="Keyword Matches" items={scores.original.keywordMatches} />
            <Divider sx={{ my: 2 }} />
            <AnalysisList title="Missing Keywords" items={scores.original.missingKeywords} />
            <Divider sx={{ my: 2 }} />
            <AnalysisList title="Formatting Issues" items={scores.original.formattingIssues} />
            <Divider sx={{ my: 2 }} />
            <AnalysisList title="Content Suggestions" items={scores.original.contentSuggestions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Optimized Resume</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ScoreCard
                title="Overall Score"
                score={scores.optimized.overallScore}
                color={scores.optimized.overallScore >= 70 ? 'success.main' : 'warning.main'}
              />
            </Grid>
            <Grid item xs={6}>
              <ScoreCard
                title="Keyword Match"
                score={scores.optimized.keywordScore}
                color={scores.optimized.keywordScore >= 70 ? 'success.main' : 'warning.main'}
              />
            </Grid>
          </Grid>
          <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
            <AnalysisList title="Keyword Matches" items={scores.optimized.keywordMatches} />
            <Divider sx={{ my: 2 }} />
            <AnalysisList title="Missing Keywords" items={scores.optimized.missingKeywords} />
            <Divider sx={{ my: 2 }} />
            <AnalysisList title="Formatting Issues" items={scores.optimized.formattingIssues} />
            <Divider sx={{ my: 2 }} />
            <AnalysisList title="Content Suggestions" items={scores.optimized.contentSuggestions} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Modify the ResumeOptimizer component to include ATS scores
const ResumeOptimizer = () => {
  const [atsScores, setAtsScores] = useState(null);
  
  // Update the handleOptimize function
  const handleOptimize = async () => {
    try {
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setOptimizedText(data.optimizedText);
        setSkillGaps(data.skillGaps);
        setAtsScores(data.atsScores);
      }
    } catch (error) {
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {optimizedText && (
        <>
          {atsScores && <ATSScoreDisplay scores={atsScores} />}
        </>
      )}
    </Box>
  );
}; 