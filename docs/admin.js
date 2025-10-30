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
  
  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.id}</td>
      <td>
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          class="product-thumb"
          onerror="this.src='https://via.placeholder.com/50?text=Img'">
      </td>
      <td><strong>${product.name}</strong></td>
      <td><span class="category-badge">${getCategoryLabel(product.category)}</span></td>
      <td>R$ ${product.price.toFixed(2)}</td>
      <td>${product.unit}</td>
      <td>${product.minOrder}</td>
      <td>${product.stock}</td>
      <td class="actions-cell">
        <button class="btn-icon btn-edit" onclick="editProduct(${product.id})" title="Editar">
          ✏️
        </button>
        <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="Excluir">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
  
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
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Editar Produto';
  
  // Preencher form
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productUnit').value = product.unit;
  document.getElementById('productMinOrder').value = product.minOrder;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productImage').value = product.image;
  document.getElementById('productDescription').value = product.description || '';
  
  // Mostrar preview da imagem existente
  const preview = document.getElementById('imagePreview');
  if (product.image) {
    preview.onclick = null;
    preview.innerHTML = `
      <img src="${product.image}" alt="Preview" class="preview-image" onclick="document.getElementById('productImageFile').click()">
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
  
  const formData = {
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    price: parseFloat(document.getElementById('productPrice').value),
    unit: document.getElementById('productUnit').value,
    minOrder: parseInt(document.getElementById('productMinOrder').value),
    stock: parseInt(document.getElementById('productStock').value),
    image: imageValue,
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

