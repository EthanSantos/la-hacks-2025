"use client"

import { useEffect, useState, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { IconArrowsUpDown, IconChevronDown, IconDots, IconClock, IconUser, IconFilter, IconMessage, IconSearch, IconDownload } from "@tabler/icons-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Message } from '@/types/sentiment';
import { moderationApi } from '@/lib/api/sentiment';

export default function ModerationHistoryPage() {
  const [historyItems, setHistoryItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');

  const fetchHistoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const messages = await moderationApi.getReviewedMessages(100);
      // Filter to only show messages that have been moderated (have moderation_action)
      const moderatedMessages = messages.filter(msg => msg.moderation_action);
      setHistoryItems(moderatedMessages);
    } catch (err) {
      console.error('Failed to fetch reviewed messages:', err);
      setError('Failed to load moderation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryItems();
  }, []);

  // Filter history items based on current filters
  const filteredHistoryItems = useMemo(() => {
    return historyItems.filter(item => {
      // Search filter
      const matchesSearch = globalFilter === '' || 
        item.message.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.player_name.toLowerCase().includes(globalFilter.toLowerCase());
      
      // Action filter
      const matchesAction = actionFilter === 'all' || item.moderation_action === actionFilter;
      
      // Date filter
      const itemDate = new Date(item.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let matchesDate = true;
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case '7days':
          matchesDate = daysDiff <= 7;
          break;
        case '30days':
          matchesDate = daysDiff <= 30;
          break;
        case '90days':
          matchesDate = daysDiff <= 90;
          break;
      }
      
      return matchesSearch && matchesAction && matchesDate;
    });
  }, [historyItems, globalFilter, actionFilter, dateFilter]);

  const getActionBadgeVariant = (action: string) => {
    switch (action?.toUpperCase()) {
      case "APPROVE":
        return { variant: "default" as const, className: "bg-green-100 text-green-800", label: "APPROVED", dotColor: "#22c55e" }
      case "WARNING":
        return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800", label: "WARNING", dotColor: "#eab308" }
      case "KICK":
        return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800", label: "KICKED", dotColor: "#2563eb" }
      case "BAN":
        return { variant: "destructive" as const, className: "bg-red-100 text-red-800", label: "BANNED", dotColor: "#ef4444" }
      default:
        return { variant: "secondary" as const, className: "bg-gray-100 text-gray-800", label: action?.toUpperCase() || "UNKNOWN", dotColor: "#6b7280" }
    }
  }

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const columns: ColumnDef<Message>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 font-medium"
        >
          <IconClock className="h-4 w-4 mr-1" />
          Time
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const timestamp = row.getValue("created_at") as string
        const relativeTime = formatRelativeTime(timestamp)
        const exactTime = new Date(timestamp).toLocaleString()
        
        return (
          <div className="text-sm font-medium" title={exactTime}>
            {relativeTime}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const a = new Date(rowA.getValue("created_at") as string).getTime()
        const b = new Date(rowB.getValue("created_at") as string).getTime()
        return a - b
      }
    },
    {
      accessorKey: "moderation_action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("moderation_action") as string
        const config = getActionBadgeVariant(action)
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className={`${config.className} text-xs`}>
              <div className="h-1.5 w-1.5 rounded-full mr-2" style={{ backgroundColor: config.dotColor }} />
              {config.label}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "player_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 font-medium"
        >
          <IconUser className="h-4 w-4 mr-1" />
          Player
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const playerName = row.getValue("player_name") as string
        const playerId = row.original.player_id
        
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {playerName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{playerName}</span>
              <span className="text-xs text-muted-foreground">ID: {playerId}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "message",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 font-medium"
        >
          <IconMessage className="h-4 w-4 mr-1" />
          Message
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const messageContent = row.getValue("message") as string
        
        return (
          <div className="max-w-[300px]">
            <div className="text-sm truncate" title={messageContent}>
              &ldquo;{messageContent}&rdquo;
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "sentiment_score",
      header: "Sentiment",
      cell: ({ row }) => {
        const score = row.getValue("sentiment_score") as number
        const getSentimentColor = (score: number) => {
          if (score > 25) return "bg-green-100 text-green-800"
          if (score < -25) return "bg-red-100 text-red-800"
          return "bg-gray-100 text-gray-800"
        }
        
        return (
          <Badge variant="outline" className={`text-xs ${getSentimentColor(score)}`}>
            {score > 0 ? '+' : ''}{score}
          </Badge>
        )
      },
    },
    {
      accessorKey: "moderation_reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.getValue("moderation_reason") as string
        return (
          <div className="text-sm max-w-[250px] truncate" title={reason}>
            {reason || "No reason provided"}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const entry = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="py-1">
                <div className="px-2 py-1.5 text-sm font-semibold">Actions</div>
                <button
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigator.clipboard.writeText(entry.message_id)}
                >
                  Copy message ID
                </button>
                <div className="my-1 h-px bg-border" />
                <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  View details
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredHistoryItems,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  if (loading) {
    return (
      <div className="@container/page flex flex-1 flex-col gap-8 p-6">
        <div className="flex flex-col gap-4 @2xl/page:flex-row @2xl/page:items-end @2xl/page:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-clash text-3xl font-medium">Moderation History</h1>
            <p className="text-muted-foreground">View and manage past moderation actions</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="@container/page flex flex-1 flex-col gap-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 @2xl/page:flex-row @2xl/page:items-end @2xl/page:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-clash text-3xl font-medium">
            Moderation History
          </h1>
          <p className="text-muted-foreground">
            View and manage past moderation actions
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-3 @lg/page:flex-row @lg/page:gap-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full @lg/page:w-[200px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="approve">Approved</SelectItem>
              <SelectItem value="warn">Warned</SelectItem>
              <SelectItem value="kick">Kicked</SelectItem>
              <SelectItem value="ban">Banned</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full @lg/page:w-[200px]">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-1">
            <IconDownload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search history..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <IconFilter className="h-4 w-4" />
              Columns
              <IconChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="py-1">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <div key={column.id} className="flex items-center px-2 py-1.5">
                      <Checkbox
                        checked={column.getIsVisible()}
                        onCheckedChange={(value: boolean) =>
                          column.toggleVisibility(!!value)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{column.id}</span>
                    </div>
                  )
                })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No moderation history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 