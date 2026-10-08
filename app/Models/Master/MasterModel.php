<?php

namespace App\Models\Master;

use App\Support\UnitContext;
use Illuminate\Database\Eloquent\Model;

abstract class MasterModel extends Model
{
    /**
     * Dynamically resolve database connection based on active unit.
     */
    public function getConnectionName()
    {
        return $this->connection ?: UnitContext::getConnection();
    }

    /**
     * Scope/helper to query a specific unit directly.
     */
    public static function forUnit(string $unit)
    {
        $instance = new static;
        $conn = UnitContext::getConnection($unit);
        $instance->setConnection($conn);

        return $instance->newQuery();
    }

    /**
     * Create a new instance of the related model and propagate connection.
     */
    protected function newRelatedInstance($class)
    {
        return tap(new $class, function ($instance) {
            if ($this->connection) {
                $instance->setConnection($this->connection);
            }
        });
    }

    /**
     * Create a new model instance from builder with inherited connection.
     */
    public function newFromBuilder($attributes = [], $connection = null)
    {
        return parent::newFromBuilder($attributes, $connection ?: $this->connection);
    }
}
