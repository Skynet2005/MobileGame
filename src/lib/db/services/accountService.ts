import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

export interface AccountSettings {
  notifications: {
    email: boolean;
    push: boolean;
    inGame: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    showLastSeen: boolean;
  };
  display: {
    theme: string;
    fontSize: string;
    highContrast: boolean;
  };
  gameplay: {
    autoSave: boolean;
    tutorialCompleted: boolean;
    graphicsQuality: string;
    soundEnabled: boolean;
    musicEnabled: boolean;
    frameRate: number;
  };
}

const defaultSettings: AccountSettings = {
  notifications: {
    email: true,
    push: true,
    inGame: true,
  },
  privacy: {
    showOnlineStatus: true,
    allowFriendRequests: true,
    showLastSeen: true,
  },
  display: {
    theme: 'system',
    fontSize: 'medium',
    highContrast: false,
  },
  gameplay: {
    autoSave: true,
    tutorialCompleted: false,
    graphicsQuality: 'High',
    soundEnabled: true,
    musicEnabled: true,
    frameRate: 60,
  },
};

export class AccountService {
  async createAccount(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await prisma.account.create({
      data: {
        email,
        passwordHash: hashedPassword,
        settings: JSON.stringify(defaultSettings),
      },
      include: { characters: true },
    });

    return {
      ...account,
      settings: JSON.parse(account.settings) as AccountSettings,
    };
  }

  async getAccountById(id: string) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: { characters: true },
    });

    if (account) {
      return {
        ...account,
        settings: JSON.parse(account.settings) as AccountSettings,
      };
    }

    return null;
  }

  async getAccountByEmail(email: string) {
    const account = await prisma.account.findUnique({
      where: { email },
      include: { characters: true },
    });

    if (account) {
      return {
        ...account,
        settings: JSON.parse(account.settings) as AccountSettings,
      };
    }

    return null;
  }

  async updateAccount(id: string, data: {
    email?: string;
    password?: string;
    settings?: Partial<AccountSettings>;
    isActive?: boolean;
  }) {
    const updateData: Record<string, any> = {};

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.settings) {
      const account = await this.getAccountById(id);
      if (!account) throw new Error('Account not found');

      const currentSettings = account.settings;
      const partialSettings = data.settings as Partial<AccountSettings>;

      const newSettings = {
        notifications: {
          ...currentSettings.notifications,
          ...(partialSettings.notifications || {}),
        },
        privacy: {
          ...currentSettings.privacy,
          ...(partialSettings.privacy || {}),
        },
        display: {
          ...currentSettings.display,
          ...(partialSettings.display || {}),
        },
        gameplay: {
          ...currentSettings.gameplay,
          ...(partialSettings.gameplay || {}),
        },
      };

      updateData.settings = JSON.stringify(newSettings);
    }

    const account = await prisma.account.update({
      where: { id },
      data: updateData,
      include: { characters: true },
    });

    return {
      ...account,
      settings: JSON.parse(account.settings) as AccountSettings,
    };
  }

  async validatePassword(accountId: string, password: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { passwordHash: true },
    });

    if (!account) return false;

    return bcrypt.compare(password, account.passwordHash);
  }

  async updateLastLogin(id: string) {
    const account = await prisma.account.update({
      where: { id },
      data: { lastLogin: new Date() },
      include: { characters: true },
    });

    return {
      ...account,
      settings: JSON.parse(account.settings) as AccountSettings,
    };
  }

  async deleteAccount(id: string) {
    const account = await prisma.account.delete({
      where: { id },
      include: { characters: true },
    });

    return {
      ...account,
      settings: JSON.parse(account.settings) as AccountSettings,
    };
  }
}
