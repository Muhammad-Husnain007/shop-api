import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

function looksHashed(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

function hidePassword(_doc, ret) {
  delete ret.passwordHash;
  delete ret.password;
  delete ret._plainPassword;
  ret.id = String(ret._id || ret.id || '');
  delete ret._id;
  delete ret.__v;
  return ret;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.virtual('password').set(function setPassword(plain) {
  this._plainPassword = String(plain || '');
});

userSchema.pre('save', async function hashPasswordOnSave() {
  if (this._plainPassword) {
    this.passwordHash = await bcrypt.hash(this._plainPassword, 12);
    this._plainPassword = undefined;
    return;
  }
  if (this.isModified('passwordHash') && this.passwordHash && !looksHashed(this.passwordHash)) {
    this.passwordHash = await bcrypt.hash(String(this.passwordHash), 12);
  }
});

userSchema.set('toJSON', { transform: hidePassword });
userSchema.set('toObject', { transform: hidePassword });

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

export const User = mongoose.model('User', userSchema);
