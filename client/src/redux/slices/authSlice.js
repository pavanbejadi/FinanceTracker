import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authService from '../../services/authService'

const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.login(data)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const signupUser = createAsyncThunk('auth/signup', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.signup(data)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const refreshUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const response = await authService.getMe()
    return response.data.user
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const updateProfileThunk = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.updateProfile(data)
    return response.data.user
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const parseStoredUser = () => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const persistUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
}

const setAuthenticatedUser = (state, user, token) => {
  state.user = user
  state.isAuthenticated = true
  if (token) {
    state.token = token
    localStorage.setItem('token', token)
  }
  if (user) persistUser(user)
}

const clearAuth = (state) => {
  state.user = null
  state.token = null
  state.isAuthenticated = false
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: parseStoredUser(),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: '',
    isAuthenticated: !!localStorage.getItem('token')
  },
  reducers: {
    setLoading: (state, action) => { state.loading = action.payload },
    setUser: (state, action) => setAuthenticatedUser(state, action.payload.user, action.payload.token),
    updateUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      persistUser(action.payload)
    },
    logout: (state) => {
      clearAuth(state)
      state.error = ''
      state.loading = false
    }
  },
  extraReducers: (builder) => {
    const addAuthRequest = (thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.loading = true; state.error = '' })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false
          state.error = action.payload || action.error.message
        })
    }
    addAuthRequest(loginUser)
    addAuthRequest(signupUser)
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        setAuthenticatedUser(state, action.payload.user, action.payload.token)
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        setAuthenticatedUser(state, action.payload.user, action.payload.token)
      })
      .addCase(refreshUser.pending, (state) => { state.loading = true; state.error = '' })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.loading = false
        setAuthenticatedUser(state, action.payload)
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || ''
        clearAuth(state)
      })
      .addCase(updateProfileThunk.pending, (state) => { state.loading = true; state.error = '' })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.loading = false
        setAuthenticatedUser(state, action.payload)
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { setLoading, setUser, updateUser, logout } = authSlice.actions
export default authSlice.reducer
