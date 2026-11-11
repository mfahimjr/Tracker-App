<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Roles from spec section 2. Permissions are added in a later step.
     */
    public function run(): void
    {
        foreach (['CEO', 'Admin', 'Staff'] as $name) {
            Role::findOrCreate($name, 'web');
        }
    }
}
