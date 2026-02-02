import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helper functions
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Database helper functions
export const checkUserAllowed = async (email) => {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('email, user_name, position, is_electrical_responsible')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('checkUserAllowed: Error:', error);
    throw error;
  }

  return data;
};

// Get electrical responsible users
export const getElectricalResponsibleUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('email, user_name, position')
      .eq('is_electrical_responsible', true)
      .order('user_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting electrical responsible users:', error);
    return [];
  }
};

export const createTimeRecord = async (record) => {
  const insertData = {
    date: record.date,
    machine_id: record.machineId,
    start_time: record.startTime,
    end_time: record.endTime,
    regular_minutes: record.regularMinutes,
    ot_minutes: record.otMinutes,
    break_minutes: record.breakMinutes,
    work_minutes: record.workMinutes,
    duration: record.duration,
    user_email: record.userEmail,
    user_name: record.userName,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('time_records')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating time record:', error);
    throw error;
  }

  return data;
};

export const getTimeRecords = async (userEmail = null) => {
  let query = supabase
    .from('time_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get multiple user wage rates at once
export const getMultipleUserWageRates = async (userEmails) => {
  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('email, wage_rate, ot_rate')
      .in('email', userEmails);

    if (error) {
      console.error('Error fetching multiple user wage rates:', error);
      return {};
    }

    const wageRates = {};
    data.forEach(user => {
      wageRates[user.email] = {
        wage_rate: user.wage_rate || 350,
        ot_rate: user.ot_rate || 525 // Default OT rate is now 525 (hourly)
      };
    });

    return wageRates;
  } catch (error) {
    console.error('Exception fetching multiple user wage rates:', error);
    return {};
  }
};

export const deleteTimeRecord = async (id) => {
  const { error } = await supabase
    .from('time_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('🗑️ supabase.js - Delete error:', error);
    throw error;
  }
};

export const createJob = async (job) => {
  try {
    // Process images - limit size for iOS compatibility
    let processedImages = [];
    if (job.openImages && Array.isArray(job.openImages)) {
      processedImages = job.openImages
        .filter(img => img && img.data)
        .map(img => ({
          id: img.id || Date.now(),
          name: img.name || 'image',
          // Only include image data if it's not too large (iOS limit)
          data: typeof img.data === 'string' && img.data.length < 300000 ? img.data : null
        }))
        .filter(img => img.data !== null);
    }

    const insertData = {
      machine_name: job.machineName || '',
      job_name: job.jobName || job.machineName || '',
      open_date: job.openDate || new Date().toISOString().split('T')[0],
      status: 'open',
      open_images: processedImages,
      drive_file_id: job.driveFileId || null,
      drive_file_link: job.driveFileLink || null,
      user_email: job.userEmail || '',
      user_name: job.userName || '',
      electrical_responsible: job.electricalResponsible || null,
      created_at: new Date().toISOString()
    };

    console.log('📤 supabase.js - Sending job data:', {
      machine_name: insertData.machine_name,
      open_date: insertData.open_date,
      user_email: insertData.user_email,
      images_count: processedImages.length
    });

    const { data, error } = await supabase
      .from('jobs')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ supabase.js - Supabase error:', error);
      throw new Error(error.message || 'Database error');
    }

    console.log('✅ supabase.js - Job created:', data?.id);
    return data;
  } catch (err) {
    console.error('❌ supabase.js - createJob exception:', err);
    throw err;
  }
};

export const updateJob = async (id, updates) => {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getJobs = async (userEmail = null) => {
  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const deleteJob = async (id) => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get machine costcenter
export const getMachineCostcenter = async (machineId) => {
  try {
    if (!machineId) {
      console.warn('Machine ID is required');
      return null;
    }

    const { data, error } = await supabase
      .from('machine_costcenter')
      .select('costcenter')
      .eq('machine_id', machineId)
      .maybeSingle(); // Use maybeSingle instead of single

    if (error) {
      console.error('Supabase error for costcenter:', { machineId, error });
      if (error.code === 'PGRST116') {
        // No rows found - return null instead of throwing error
        console.warn(`No costcenter found for machine: ${machineId}`);
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting machine costcenter:', { machineId, error });
    return null;
  }
};

// Add additional images to existing job
export const addAdditionalImages = async (jobId, newImages, imageType = 'close') => {
  try {
    // Get current job data
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!currentJob) {
      throw new Error('Job not found or access denied');
    }

    // Add new images to existing images
    const existingImages = currentJob[imageType + '_images'] || [];
    const updatedImages = [...existingImages, ...newImages];

    // Update job with new images
    const { data, error } = await supabase
      .from('jobs')
      .update({
        [imageType + '_images']: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Failed to update job - access denied');
    }

    return data;
  } catch (error) {
    console.error('📸 supabase.js - Error adding additional images:', error);
    throw error;
  }
};

// Delete specific image from job
export const deleteJobImage = async (jobId, imageId, imageType = 'close') => {
  try {
    console.log('🗑️ deleteJobImage called:', { jobId, imageId, imageType });

    // Get current job data
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchError) {
      console.error('🗑️ Fetch error:', fetchError);
      throw fetchError;
    }
    if (!currentJob) {
      console.error('🗑️ Job not found:', jobId);
      throw new Error('Job not found or access denied');
    }

    console.log('🗑️ Current job:', currentJob.id, currentJob.machine_name);

    // Remove specific image from existing images
    const columnName = imageType + '_images';
    const existingImages = currentJob[columnName] || [];

    console.log('🗑️ Existing images in', columnName, ':', existingImages.length);
    console.log('🗑️ Looking for imageId:', imageId, 'type:', typeof imageId);

    // Convert both to string for comparison to handle number vs string mismatch
    const updatedImages = existingImages.filter(img => {
      const imgIdStr = String(img.id);
      const targetIdStr = String(imageId);
      const keepImage = imgIdStr !== targetIdStr;
      console.log('🗑️ Comparing:', imgIdStr, 'vs', targetIdStr, '-> keep:', keepImage);
      return keepImage;
    });

    console.log('🗑️ Images after filter:', updatedImages.length);

    // Update job with remaining images
    const { data, error } = await supabase
      .from('jobs')
      .update({
        [columnName]: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('🗑️ Update error:', error);
      throw error;
    }
    if (!data) {
      console.error('🗑️ No data returned after update');
      throw new Error('Failed to update job - access denied');
    }

    console.log('🗑️ Successfully deleted image, remaining:', data[columnName]?.length || 0);
    return data;
  } catch (error) {
    console.error('🗑️ supabase.js - Error deleting job image:', error);
    throw error;
  }
};

// Get user wage rates
export const getUserWageRates = async (email) => {
  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('wage_rate, ot_rate')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user wage rates:', error);
    return { wage_rate: 350, ot_rate: 525 }; // Default OT rate is now 525 (hourly)
  }
};
