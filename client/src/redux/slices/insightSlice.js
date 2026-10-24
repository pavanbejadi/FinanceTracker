import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as aiService from '../../services/aiService'

const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

export const fetchInsights = createAsyncThunk(
  'insights/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiService.generateInsights()
      return response.data.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  },
  { condition: (_, { getState }) => getState().insights.status !== 'loading' },
)

export const fetchPrediction = createAsyncThunk(
  'insights/predict',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiService.predictSpending()
      return response.data.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  },
  { condition: (_, { getState }) => getState().insights.predictionStatus !== 'loading' },
)

const markInsightsStale = (state) => {
  state.status = 'idle'
  state.predictionStatus = 'idle'
  state.error = ''
}

const insightSlice = createSlice({
  name: 'insights',
  initialState: {
    insights: [],
    predictions: {},
    provider: '',
    loading: false,
    status: 'idle',
    predictionStatus: 'idle',
    error: '',
  },
  reducers: {
    setInsights: (state, action) => { state.insights = action.payload },
    setPredictions: (state, action) => { state.predictions = action.payload },
    setLoading: (state, action) => { state.loading = action.payload }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsights.pending, (state) => {
        state.loading = true
        state.status = 'loading'
        state.error = ''
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false
        state.status = 'succeeded'
        state.insights = [...(action.payload.insights || []), ...(action.payload.recommendations || [])]
        state.provider = action.payload.provider || 'heuristic'
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false
        state.status = 'failed'
        state.error = action.payload || action.error.message
      })
      .addCase(fetchPrediction.pending, (state) => { state.predictionStatus = 'loading' })
      .addCase(fetchPrediction.fulfilled, (state, action) => {
        state.predictions = action.payload
        state.predictionStatus = 'succeeded'
      })
      .addCase(fetchPrediction.rejected, (state, action) => {
        state.predictionStatus = 'failed'
        if (!state.error) state.error = action.payload || action.error.message
      })
      .addCase('transactions/save/fulfilled', markInsightsStale)
      .addCase('transactions/delete/fulfilled', markInsightsStale)
      .addCase('budget/save/fulfilled', markInsightsStale)
      .addCase('auth/logout', markInsightsStale)
      .addCase('auth/login/fulfilled', markInsightsStale)
      .addCase('auth/signup/fulfilled', markInsightsStale)
  }
})

export const { setInsights, setPredictions, setLoading } = insightSlice.actions
export default insightSlice.reducer
