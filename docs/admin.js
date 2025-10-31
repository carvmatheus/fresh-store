// Admin.js - Gestão de produtos (API Backend)

// Estado global
let products = [];
let currentEditId = null;
let allProducts = [];

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  loadProductsTable();
  
  // Form submit handler
  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProduct();
  });
});

// Carregar produtos da API
async function loadProducts() {
  try {
    allProducts = await api.getProducts();
    products = [...allProducts];
    console.log('✅ Produtos carregados da API:', products.length);
  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    allProducts = [];
    products = [];
  }
}

// Carregar tabela de produtos
function loadProductsTable() {
  console.log('loadProductsTable chamado');
  console.log('Produtos a exibir:', products.length);
  
  const tbody = document.getElementById('productsTableBody');
  
  if (!tbody) {
    console.error('Elemento productsTableBody não encontrado!');
    return;
  }
  
  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          Nenhum produto encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = products.map(product => {
    // Normalizar dados do backend (MongoDB ou PostgreSQL)
    const imageUrl = product.image || product.image_url || 'https://via.placeholder.com/50?text=Img';
    const minOrder = product.minOrder || product.min_order || 1;
    const productId = String(product.id);
    
    return `
    <tr>
      <td>${productId}</td>
      <td>
        <img 
          src="${imageUrl}" 
          alt="${product.name}" 
          class="product-thumb"
          onerror="this.src='https://via.placeholder.com/50?text=Img'">
      </td>
      <td><strong>${product.name}</strong></td>
      <td><span class="category-badge">${getCategoryLabel(product.category)}</span></td>
      <td>R$ ${parseFloat(product.price).toFixed(2)}</td>
      <td>${product.unit}</td>
      <td>${minOrder}</td>
      <td>${product.stock}</td>
      <td class="actions-cell">
        <button class="btn-icon btn-edit" onclick='editProduct("${productId}")' title="Editar">
          ✏️
        </button>
        <button class="btn-icon btn-delete" onclick='deleteProduct("${productId}")' title="Excluir">
          🗑️
        </button>
      </td>
    </tr>
  `;
  }).join('');
  
  console.log('Tabela atualizada com sucesso');
}

// Abrir modal de produto (novo)
function openProductModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Novo Produto';
  document.getElementById('productForm').reset();
  document.getElementById('productImageFile').value = '';
  document.getElementById('productImage').value = '';
  
  // Resetar preview
  const preview = document.getElementById('imagePreview');
  preview.onclick = function() { document.getElementById('productImageFile').click(); };
  preview.innerHTML = `
    <div class="preview-placeholder">
      <span class="preview-icon">🖼️</span>
      <p>Clique para selecionar uma imagem</p>
      <small>JPG, PNG ou GIF</small>
    </div>
  `;
  
  document.getElementById('productModal').classList.add('show');
}

// Fechar modal
function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
  currentEditId = null;
}

// Editar produto
function editProduct(id) {
  const product = allProducts.find(p => p.id === id || p.id === String(id));
  if (!product) {
    console.error('Produto não encontrado:', id);
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Editar Produto';
  
  // Normalizar dados do backend (MongoDB ou PostgreSQL)
  const imageUrl = product.image || product.image_url || '';
  const minOrder = product.minOrder || product.min_order || 1;
  
  // Preencher form
  if (document.getElementById('productId')) {
    document.getElementById('productId').value = product.id;
  }
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = parseFloat(product.price);
  document.getElementById('productUnit').value = product.unit;
  document.getElementById('productMinOrder').value = minOrder;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productImage').value = imageUrl;
  document.getElementById('productDescription').value = product.description || '';
  
  // Mostrar preview da imagem existente
  const preview = document.getElementById('imagePreview');
  if (imageUrl) {
    preview.onclick = null;
    preview.innerHTML = `
      <img src="${imageUrl}" alt="Preview" class="preview-image" onclick="document.getElementById('productImageFile').click()">
      <button type="button" class="btn-remove-image" onclick="removeImage(event)">
        🗑️ Remover
      </button>
    `;
  } else {
    preview.onclick = function() { document.getElementById('productImageFile').click(); };
  }
  
  document.getElementById('productModal').classList.add('show');
}

// Salvar produto (criar ou editar)
async function saveProduct() {
  console.log('saveProduct chamado');
  
  // Validar imagem
  const imageValue = document.getElementById('productImage').value;
  if (!imageValue) {
    alert('Por favor, selecione uma imagem para o produto!');
    return;
  }
  
  // Dados no formato do backend (MongoDB)
  const formData = {
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    price: parseFloat(document.getElementById('productPrice').value),
    unit: document.getElementById('productUnit').value,
    minOrder: parseInt(document.getElementById('productMinOrder').value),  // MongoDB usa minOrder
    stock: parseInt(document.getElementById('productStock').value),
    image: imageValue,  // MongoDB usa image
    description: document.getElementById('productDescription').value
  };
  
  console.log('Dados do produto:', formData);
  
  try {
    if (currentEditId) {
      // Editar existente
      await api.updateProduct(currentEditId, formData);
      alert('Produto atualizado com sucesso!');
    } else {
      // Criar novo
      await api.createProduct(formData);
      alert('Produto criado com sucesso!');
    }
    
    // Recarregar lista
    await loadProducts();
    loadProductsTable();
    closeProductModal();
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    alert('Erro ao salvar produto: ' + error.message);
  }
}

// Deletar produto
async function deleteProduct(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) {
    return;
  }
  
  try {
    await api.deleteProduct(id);
    alert('Produto excluído com sucesso!');
    
    // Recarregar lista
    await loadProducts();
    loadProductsTable();
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    alert('Erro ao excluir produto: ' + error.message);
  }
}

// Filtrar produtos
function filterProducts() {
  const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
  const categoryFilter = document.getElementById('filterCategory').value;
  
  products = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                         product.description.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  loadProductsTable();
}

// Helper: Label de categoria
function getCategoryLabel(category) {
  const labels = {
    'verduras': 'Verduras',
    'legumes': 'Legumes',
    'frutas': 'Frutas',
    'graos': 'Grãos',
    'temperos': 'Temperos'
  };
  return labels[category] || category;
}

