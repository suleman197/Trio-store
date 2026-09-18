const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    quantityChanged: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
