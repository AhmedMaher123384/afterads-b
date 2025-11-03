import express from 'express';
import Client from '../models/Client.js';

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const { search, limit, page } = req.query;
    let clients;
    
    if (search) {
      // Text search
      clients = await Client.searchByText(search);
    } else {
      // Get all clients with simple sorting
      clients = await Client.find({})
        .sort({ createdAt: -1 });
    }
    
    // Pagination
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    const total = clients.length;
    const paginatedClients = clients.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);
    
    // Always return consistent format
    res.json({
      clients: paginatedClients,
      total,
      page: pageNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    });
    
    console.log(`✅ Found ${clients.length} clients`);
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 Fetching client by ID:', id);
    
    const client = await Client.findOne({ id: parseInt(id) });
    
    if (!client) {
      return res.status(404).json({ 
        error: 'Client not found',
        message: `No client found with ID: ${id}`
      });
    }
    
    res.json({ client });
    console.log(`✅ Found client: ${client.name}`);
  } catch (error) {
    console.error('❌ Error fetching client:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new client:', req.body);
    
    const clientData = {
      name: req.body.name,
      logo: req.body.logo,
      website: req.body.website || ''
    };
    
    const newClient = new Client(clientData);
    const savedClient = await newClient.save();
    
    res.status(201).json({ 
      client: savedClient,
      message: 'Client created successfully'
    });
    
    console.log(`✅ Created client: ${savedClient.name}`);
  } catch (error) {
    console.error('❌ Error creating client:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating client:', id, req.body);
    
    const client = await Client.findOne({ id: parseInt(id) });
    
    if (!client) {
      return res.status(404).json({ 
        error: 'Client not found',
        message: `No client found with ID: ${id}`
      });
    }
    
    // Update fields - only allow name, logo, and website
    const allowedFields = ['name', 'logo', 'website'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });
    
    const updatedClient = await client.save();
    
    res.json({ 
      client: updatedClient,
      message: 'Client updated successfully'
    });
    
    console.log(`✅ Updated client: ${updatedClient.name}`);
  } catch (error) {
    console.error('❌ Error updating client:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting client:', id);
    
    const client = await Client.findOne({ id: parseInt(id) });
    
    if (!client) {
      return res.status(404).json({ 
        error: 'Client not found',
        message: `No client found with ID: ${id}`
      });
    }
    
    await Client.deleteOne({ id: parseInt(id) });
    
    res.json({ 
      message: 'Client deleted successfully',
      deletedClient: client
    });
    
    console.log(`✅ Deleted client: ${client.name}`);
  } catch (error) {
    console.error('❌ Error deleting client:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});



export default router;