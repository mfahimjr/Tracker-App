<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Local development data only. Demo accounts match the prototype's login screen.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $demo = [
            ['Aina Rahman', 'aina@pepper.my', 'Admin'],
            ['Daniel Lee', 'daniel@pepper.my', 'Staff'],
            ['Siti Noor', 'siti@cloudco.my', 'Staff'],
            ['Fahim', 'fahim@pepper.my', 'Admin'],
        ];

        foreach ($demo as [$name, $email, $role]) {
            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => 'demo1234', 'notification_settings' => []],
            );
            $user->syncRoles([$role]);
        }
    }
}
